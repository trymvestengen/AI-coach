# Seed/dev fixture user id — used by api/db/seed.py and api/scripts/ only.
# NOT used in any request path; tool handlers are auth-aware and take the
# authenticated user_id (see api/app/tools/handlers.py).
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
