# Edge Function: send-invite

Emails a trainer's client-invite link (`<APP_URL>/?trainer=CODE`) to a client
straight from the app (trainer panel → invite by email). The function
authenticates the caller, re-checks their role server-side, builds the URL
from the caller's own invite code, and sends via the Brevo transactional API.

## One-time deploy

```bash
# from the repo root (gym-tracker-react/)
npm install -g supabase            # once, if the CLI is not installed
supabase login                     # browser auth
supabase link --project-ref dtzovlvgmymlptprdxcz
supabase functions deploy send-invite
```

## Secrets (once, or when rotating)

```bash
supabase secrets set \
  BREVO_API_KEY=xkeysib-... \
  SENDER_EMAIL=the-verified-brevo-sender@example.com \
  APP_URL=https://gymworkoutjm.vercel.app
```

- `BREVO_API_KEY` is an **API v3 key** from Brevo → SMTP & API → **API Keys**
  tab (starts `xkeysib-`). It is NOT the SMTP key (`xsmtpsib-`) used for the
  Supabase auth emails.
- `SENDER_EMAIL` must be a sender verified in Brevo (Senders, Domains, IPs).
- `SENDER_NAME` is optional (defaults to "Gym Tracker").

Rotating secrets takes effect on the next invocation; no redeploy needed.

## Smoke test after deploying

1. Sign in as a trainer, open the trainer panel, use **Invite by email** to
   send to an inbox you control.
2. Expect the "Invitation sent!" confirmation, the email within a minute, and
   a `200` in Dashboard → Edge Functions → send-invite → Logs.
3. Clicking the email's button must open sign-up with the trainer code
   pre-filled; after signup the client appears in the trainer's client list.

Failures surface as JSON `{"error": ...}` in the function logs and as the
generic UI error in the app.
