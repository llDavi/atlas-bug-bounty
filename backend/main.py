from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import stripe

from sources.aggregator import get_programs as fetch_programs
from sources.walkthroughs import get_list as fetch_walkthroughs, get_detail as fetch_walkthrough
from sources.auth import require_pro, require_auth, require_admin
from sources.db import init_db
from sources import submissions, billing
from sources.config import ALLOWED_ORIGINS

app = FastAPI(title="Bounty Radar API")
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    program_name: str
    platform: str
    program_url: str
    contact_email: str
    notes: str = ""


@app.post("/api/get-listed")
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
