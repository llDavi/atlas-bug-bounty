import os

from dotenv import load_dotenv

load_dotenv()

HACKERONE_USERNAME = os.environ.get("HACKERONE_USERNAME", "")
HACKERONE_API_TOKEN = os.environ.get("HACKERONE_API_TOKEN", "")

INTIGRITI_API_TOKEN = os.environ.get("INTIGRITI_API_TOKEN", "")

CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY", "")

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_ID_MONTHLY = os.environ.get("STRIPE_PRICE_ID_MONTHLY", "")
STRIPE_PRICE_ID_YEARLY = os.environ.get("STRIPE_PRICE_ID_YEARLY", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Comma-separated list of extra origins allowed to call the API (e.g. a Vercel preview
# domain or a production custom domain). FRONTEND_URL is always allowed.
_extra_origins = os.environ.get("EXTRA_CORS_ORIGINS", "")
ALLOWED_ORIGINS = [FRONTEND_URL] + [o.strip() for o in _extra_origins.split(",") if o.strip()]
