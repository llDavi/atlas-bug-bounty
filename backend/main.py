import re

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import stripe

from sources.aggregator import get_programs as fetch_programs
from sources.walkthroughs import get_list as fetch_walkthroughs, get_detail as fetch_walkthrough
from sources.auth import require_pro, require_auth, require_admin, optional_auth
from sources.db import init_db
from sources import submissions, billing, ratelimit, store, hunters, quests
from sources.realm import KINGDOMS
from sources.config import ALLOWED_ORIGINS

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

app = FastAPI(title="Bounty Radar API")
init_db()
store.init_schema()
quests.validate()  # malformed quest content fails the boot, not a hunter

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/programs")
def get_programs():
    return fetch_programs()


@app.get("/api/programs/{program_id}")
def get_program(program_id: int):
    for program in fetch_programs():
        if program["id"] == program_id:
            return program
    raise HTTPException(status_code=404, detail="Program not found")


@app.get("/api/walkthroughs")
def get_walkthroughs():
    return fetch_walkthroughs()


@app.get("/api/walkthroughs/{slug}")
def get_walkthrough(slug: str, _user=Depends(require_pro)):
    walkthrough = fetch_walkthrough(slug)
    if not walkthrough:
        raise HTTPException(status_code=404, detail="Walkthrough not found")
    return walkthrough


class GetListedRequest(BaseModel):
    program_name: str = Field(max_length=200)
    platform: str = Field(max_length=50)
    program_url: str = Field(max_length=500)
    contact_email: str = Field(max_length=320)
    notes: str = Field("", max_length=2000)

    @field_validator("contact_email")
    @classmethod
    def _valid_email(cls, v):
        if not _EMAIL_RE.match(v.strip()):
            raise ValueError("Invalid email format")
        return v


@app.post("/api/get-listed", dependencies=[Depends(ratelimit.by_ip(5, 3600))])
def post_get_listed(body: GetListedRequest):
    if not body.program_name.strip() or not body.program_url.strip() or not body.contact_email.strip():
        raise HTTPException(status_code=400, detail="Missing required fields")
    submissions.create_submission(
        program_name=body.program_name.strip(),
        platform=body.platform.strip(),
        program_url=body.program_url.strip(),
        contact_email=body.contact_email.strip(),
        notes=body.notes.strip(),
    )
    return {"ok": True}


@app.get("/api/admin/get-listed")
def get_admin_submissions(_admin=Depends(require_admin)):
    return submissions.list_submissions()


class CheckoutRequest(BaseModel):
    plan: str


@app.post("/api/billing/checkout")
def post_billing_checkout(body: CheckoutRequest, user=Depends(require_auth)):
    clerk_user_id = user["sub"]
    ratelimit.check(f"checkout:{clerk_user_id}", max_requests=10, window_seconds=3600)
    email = billing.get_user_email(clerk_user_id)
    try:
        url = billing.create_checkout_session(clerk_user_id, email, body.plan)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"url": url}


@app.post("/api/billing/portal")
def post_billing_portal(user=Depends(require_auth)):
    clerk_user_id = user["sub"]
    customer_id = billing.get_customer_id_for_user(clerk_user_id)
    if not customer_id:
        raise HTTPException(status_code=404, detail="No active subscription found")
    url = billing.create_portal_session(customer_id)
    return {"url": url}


@app.post("/api/billing/webhook")
async def post_billing_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = billing.construct_event(payload, sig_header)
    except (stripe.error.SignatureVerificationError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    billing.handle_event(event)
    return {"received": True}


# ---------------------------------------------------------------- hunters


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    alignment: str = Field(max_length=40)
    kingdoms: list[str] = Field(min_length=1, max_length=len(KINGDOMS))
    oath: bool


class HunterUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=40)
    alignment: str | None = Field(None, max_length=40)
    kingdoms: list[str] | None = Field(None, min_length=1, max_length=len(KINGDOMS))


class AnswerRequest(BaseModel):
    question_id: str = Field(max_length=80)
    answer: str = Field(max_length=500)


@app.get("/api/hunter/me")
def get_hunter_me(user=Depends(require_auth)):
    hunter = hunters.get_hunter(user["sub"])
    if not hunter:
        raise HTTPException(status_code=404, detail="Not registered")
    return hunter


@app.post("/api/hunter/register", status_code=201)
def post_hunter_register(body: RegisterRequest, user=Depends(require_auth)):
    ratelimit.check(f"register:{user['sub']}", max_requests=10, window_seconds=3600)
    if not body.oath:
        raise HTTPException(status_code=400, detail="The oath must be sworn to sign the register")
    try:
        return hunters.register(user["sub"], body.name, body.alignment, body.kingdoms)
    except hunters.AlreadyRegistered:
        raise HTTPException(status_code=409, detail="Already registered")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.patch("/api/hunter/me")
def patch_hunter_me(body: HunterUpdate, user=Depends(require_auth)):
    try:
        hunter = hunters.update(user["sub"], name=body.name, alignment=body.alignment, kingdoms=body.kingdoms)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not hunter:
        raise HTTPException(status_code=404, detail="Not registered")
    return hunter


# ---------------------------------------------------------------- quests


# Anyone may read the quest list — names, places, rewards. Only a signed-in
# hunter may open a lesson or answer it.


@app.get("/api/quests")
def get_quest_list(kingdom: str | None = None, user=Depends(optional_auth)):
    if not user:
        return quests.list_public(kingdom)
    clerk_id = user["sub"]
    return quests.list_public(kingdom, hunters.completed_slugs(clerk_id), hunters.answered_counts(clerk_id))


@app.get("/api/quests/{slug}")
def get_quest_detail(slug: str, user=Depends(require_auth)):
    clerk_id = user["sub"]
    quest = quests.get_public(slug, hunters.completed_slugs(clerk_id), hunters.answered_ids(clerk_id, slug))
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    return quest


@app.post("/api/quests/{slug}/answer")
def post_quest_answer(slug: str, body: AnswerRequest, user=Depends(require_auth)):
    clerk_id = user["sub"]
    ratelimit.check(f"answer:{clerk_id}", max_requests=120, window_seconds=600)
    if not hunters.is_registered(clerk_id):
        raise HTTPException(status_code=403, detail="Sign the register first")
    meta = quests.meta(slug)
    if not meta:
        raise HTTPException(status_code=404, detail="Quest not found")
    if not quests.is_unlocked(slug, hunters.completed_slugs(clerk_id)):
        raise HTTPException(status_code=403, detail="This quest is still locked")

    correct = quests.check(slug, body.question_id, body.answer)
    if correct is None:
        raise HTTPException(status_code=404, detail="Question not found")
    if correct:
        hunters.record_correct_answer(clerk_id, slug, body.question_id)

    answered = hunters.answered_ids(clerk_id, slug)
    finished = set(quests.question_ids(slug)) <= answered
    xp_awarded = meta["xp"] if finished and hunters.complete_quest(clerk_id, slug, meta["kingdom"], meta["xp"]) else 0
    return {
        "correct": correct,
        "answered": sorted(answered),
        "completed": finished,
        "xp_awarded": xp_awarded,
        "xp_total": hunters.total_xp(clerk_id),
    }


# ---------------------------------------------------------------- the roll


@app.get("/api/roll", dependencies=[Depends(ratelimit.by_ip(120, 60))])
def get_roll(kingdom: str | None = None, user=Depends(optional_auth)):
    """Public standing. Only the register name, alignment and record are
    shown — never the account behind them."""
    try:
        rows = hunters.roll(kingdom)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    me = user["sub"] if user else None
    return [
        {"place": place, "name": r["name"], "alignment": r["alignment"], "xp": r["xp"],
         "quests": r["quests"], "is_you": r["clerk_id"] == me}
        for place, r in enumerate(rows, start=1)
    ]
