# InstaLite

InstaLite is a small Instagram-inspired photo-sharing app using Supabase for authentication, PostgreSQL data, Storage, and Realtime updates.

## Local setup

Requirements: Node.js 20 or newer.

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` and add the values from Supabase Dashboard → Project Settings → API:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run `supabase/schema.sql` in the Supabase SQL Editor. The script is safe to run repeatedly.

Start the app:

```powershell
npm start
```

Open <http://localhost:3000>.

The server reads `.env` and exposes only the public URL and anon key through `/api/config`. Never expose a Supabase service-role key to the browser.

## Supabase schema

- `auth.users` is managed by Supabase Auth for email/password sign-up and sign-in.
- `public.profiles` stores display names and is created automatically after sign-up.
- `public.posts` stores captions and image metadata.
- Row Level Security protects profile and post writes.
- The `post-images` Storage bucket contains photos under `posts/{user_id}/...`.

## Tests

```powershell
npm test
```

## Troubleshooting

- If Supabase is not configured, confirm `.env` exists beside `server.js` and restart `npm start`.
- Open `/api/config` in the browser and verify it returns non-empty `url` and `anonKey` values.
- If the feed remains on “Finding your little moments…”, check the browser console for blocked CDN or network requests.
- The realtime publication step in `supabase/schema.sql` is guarded and safe to rerun.
