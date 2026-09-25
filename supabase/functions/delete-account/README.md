# Edge Function: delete-account

Deletes the signed-in user's own account from the profile menu. The caller
is identified from their session; the request carries no user id, so no one
can delete another account through it. Admins are refused (demote first) so
the last admin cannot disappear.

Deleting the auth user removes everything else through the foreign keys:
`profiles`, `workout_plans`, `user_preferences`, `trainer_clients`,
`trainer_invites` and `rest_timer_pushes` cascade, and `profiles.trainer_id`
of former clients is set to null. Feedback is sent by email and is not
stored in the database.

## Deploy

```bash
supabase functions deploy delete-account
```

No extra secrets: it uses the project's default `SUPABASE_URL`,
`SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.

## Smoke test

1. Sign up a throwaway account, add an exercise, open Profile menu → Delete
   my account, type DELETE, confirm.
2. The app returns to sign-in; signing in with that email fails.
3. In the SQL editor, `select * from profiles where email = '...'` returns
   no rows.
