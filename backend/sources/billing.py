"""Stripe subscription billing for Atlas Pro.

Checkout creates a Stripe-hosted Checkout Session for a recurring price.
The webhook is the source of truth for activating/revoking Pro: it flips
is_pro in the user's Clerk public_metadata.

The customer id <-> Clerk user id mapping is kept in Clerk metadata rather
than in our own SQLite table: clerk_user_id is propagated onto the Stripe
Subscription itself via subscription_data.metadata at checkout time, so
subscription.updated/deleted events carry it directly without a lookup, and
stripe_customer_id is stored in the Clerk user's private_metadata for the
billing portal. This avoids relying on Render's free-tier ephemeral disk for
data that would otherwise break a Pro user's billing portal access on every
redeploy.
"""

import stripe
from clerk_backend_api import Clerk

from .config import (
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID_MONTHLY,
    STRIPE_PRICE_ID_YEARLY,
    FRONTEND_URL,
    CLERK_SECRET_KEY,
)

stripe.api_key = STRIPE_SECRET_KEY

_PLAN_TO_PRICE = {
    "monthly": STRIPE_PRICE_ID_MONTHLY,
    "yearly": STRIPE_PRICE_ID_YEARLY,
}

_clerk = Clerk(bearer_auth=CLERK_SECRET_KEY)


def get_user_email(clerk_user_id: str) -> str | None:
    user = _clerk.users.get(user_id=clerk_user_id)
    for addr in user.email_addresses or []:
        if addr.id == user.primary_email_address_id:
            return addr.email_address
    return user.email_addresses[0].email_address if user.email_addresses else None


def create_checkout_session(clerk_user_id: str, email: str, plan: str) -> str:
    price_id = _PLAN_TO_PRICE.get(plan)
    if not price_id:
        raise ValueError(f"Unknown plan: {plan}")

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        client_reference_id=clerk_user_id,
        customer_email=email,
        success_url=f"{FRONTEND_URL}/pro/success",
        cancel_url=f"{FRONTEND_URL}/pro",
        metadata={"clerk_user_id": clerk_user_id},
        subscription_data={"metadata": {"clerk_user_id": clerk_user_id}},
    )
    return session.url


def create_portal_session(stripe_customer_id: str) -> str:
    session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=f"{FRONTEND_URL}/pro",
    )
    return session.url


def get_customer_id_for_user(clerk_user_id: str) -> str | None:
    user = _clerk.users.get(user_id=clerk_user_id)
    return (user.private_metadata or {}).get("stripe_customer_id")


def _set_is_pro(clerk_user_id: str, is_pro: bool):
    _clerk.users.update_metadata(user_id=clerk_user_id, public_metadata={"is_pro": is_pro})


def _link_customer(clerk_user_id: str, stripe_customer_id: str):
    _clerk.users.update_metadata(
        user_id=clerk_user_id,
        private_metadata={"stripe_customer_id": stripe_customer_id},
    )


def construct_event(payload: bytes, sig_header: str):
    return stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)


def handle_event(event: dict):
    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        clerk_user_id = data.get("client_reference_id") or data.get("metadata", {}).get("clerk_user_id")
        customer_id = data.get("customer")
        if clerk_user_id and customer_id:
            _link_customer(clerk_user_id, customer_id)
            _set_is_pro(clerk_user_id, True)

    elif event_type in ("customer.subscription.updated", "customer.subscription.deleted"):
        clerk_user_id = data.get("metadata", {}).get("clerk_user_id")
        if clerk_user_id:
            is_active = data.get("status") in ("active", "trialing") and event_type != "customer.subscription.deleted"
            _set_is_pro(clerk_user_id, is_active)
