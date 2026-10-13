## Tests

Run the existing test suite:

```powershell
npm test
```

## Troubleshooting

- If Supabase is not configured, confirm `.env` exists beside `server.js`, contains the correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`, and restart the app with `npm start`.
- Open `/api/config` in the browser and verify it returns non-empty `url` and `anonKey` values. Never expose a service-role key to the browser.
- If the feed remains on “Finding your little moments…”, check the browser console for blocked CDN or network requests.
- The Realtime publication setup in `supabase/schema.sql` is guarded and safe to rerun.

### Fixing Storage row-level security errors

If sharing a post reports `new row violates row-level security policy`, Supabase Storage rejected the image upload. Verify that the `post-images` bucket exists and that its Storage INSERT policy allows authenticated users to upload only to their own `posts/{user_id}/...` folder. Keep Row Level Security enabled; do not make uploads unrestricted or expose a service-role key in frontend code.

If the error persists, inspect the active Storage INSERT policy in the SQL Editor for the same Supabase project configured in `.env`. Also verify that the user is signed in and that the upload path matches the policy.

### Fixing signup email rate limits

If signup displays `email rate limit exceeded` or an HTTP 429 response, Supabase is limiting email sends for the project. Stop repeating signup or confirmation requests and wait before trying again. If an account may already exist, try signing in instead.

For ongoing development, review the project's Authentication email rate limits or configure custom SMTP. If sign-in reports `Email not confirmed`, the existing account still needs confirmation, or email confirmation must be configured appropriately for your development workflow. Disabling confirmation for development does not necessarily confirm an account that was already created.

## Data model

The `public.posts` table stores:

```text
user_id     Supabase Auth UID of the author
username    Author display name
caption     Post caption (up to 500 characters)
image_url   Supabase Storage image URL
image_path  Storage path: posts/{user_id}/{generated-filename}
created_at  Postgres server timestamp
```

Check `supabase/schema.sql` for the authoritative schema and column names.

## Workshop contribution ideas

Good follow-up issues include likes, comments, saved posts, story playback, profile editing, and avatar uploads. Include appropriate Row Level Security policies and tests whenever an issue adds a table or changes what users may read or write.