# Seed/dev/test fixture user id — brukt av api/db/seed.py, api/scripts/ og test-suiten.
# IKKE i bruk i request-stien: tool-laget (dispatcher + handlers/) er auth-aware og
# bruker den autentiserte user_id.
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
