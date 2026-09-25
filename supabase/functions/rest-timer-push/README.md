# Edge Function: rest-timer-push

Sends the end-of-rest notification from the server. The rest timer asks for
it when a rest starts; the function waits until the end time and sends a Web
Push unless the rest was paused, reset or replaced first.

This is what makes the notification work on iPhone: iOS freezes a web app as
soon as it leaves the screen, so the page cannot raise a notification there.
iOS delivers Web Push only to an app added to the home screen (iOS 16.4+).
Android gets the same push.

## One-time setup

1. Table: run `supabase/rest-timer-push.sql` in the SQL Editor.
2. Secrets (the public key must match `src/constants/push.js`):

   ```bash
   supabase secrets set \
     VAPID_PUBLIC_KEY=... \
     VAPID_PRIVATE_KEY=... \
     VAPID_SUBJECT=mailto:you@example.com
   ```

   A new pair can be made with `npx web-push generate-vapid-keys`. Changing
   the pair means updating `src/constants/push.js` too; devices resubscribe
   on their next rest.
3. Deploy: `supabase functions deploy rest-timer-push`

## Limits

- The Free plan stops a function 150 s after it starts, so the longest rest
  that gets a push is 140 s (`MAX_DELAY_MS`). All presets (up to 2:00) fit.
  Longer rests still get the in-app alert when the user comes back.
- One invocation per rest plus one per cancel.
- Delivery timing is up to Apple and Google; usually within a second or two.

## Smoke test

1. Install the app to the iPhone home screen and open it from there.
2. Start a 0:30 rest, allow notifications, lock the phone.
3. The notification arrives at 0:00; tapping it opens the red screen.
4. Dashboard -> Edge Functions -> rest-timer-push -> Logs shows the calls;
   `push failed 410` means the subscription expired and the next rest will
   make a new one.
