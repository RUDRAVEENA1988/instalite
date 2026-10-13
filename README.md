# InstaLite

InstaLite is a beginner-friendly, Instagram-inspired photo-sharing app for learning frontend development, Supabase, and open-source collaboration.

## Features

- Responsive Instagram-inspired interface with sample story circles and a live photo feed.
- Supabase Authentication with email/password sign-up and sign-in.
- Postgres stores shared post metadata and updates the feed in real time.
- Supabase Storage stores JPEG, PNG, and WebP photos (up to 5 MB).
- Postgres and Storage Security Rules require sign-in to create posts and scope uploads to their owner.
- Supabase Emulator Suite configuration for local development without a real Supabase project.
- Express serves the app locally; Supabase Hosting can host the same static frontend.
- Likes, comments, saved posts, story playback, and editable profiles are not implemented yet.

## Technology stack

- HTML, CSS, and vanilla JavaScript modules
- Node.js and Express for local static hosting
- Supabase Authentication, Cloud Postgres, Cloud Storage, and Supabase Hosting
- Supabase Local Emulator Suite for local development

## Requirements

- Node.js 20 or newer
- npm
- Java (required by the Supabase local development)

## Install and run with local emulators

Install the Node dependencies:

```bash
npm install
```

Start the Supabase local development in one terminal:

```bash
npm run emulators
```

The first emulator run may download emulator binaries. In another terminal, serve the app:

```bash
npm start
```

Open <http://localhost:3000/?emulator=1>. The `emulator=1` query parameter connects the app to the local Auth, Postgres, and Storage emulators using the demo project `demo-instalite`. Do not use this parameter against production.

The Emulator UI is available at <http://localhost:4000>. Emulator data is local and disposable; it is not copied into a Supabase project.

Run the tests with:

```bash
npm test
```

## Supabase setup guide

For local development and trying the app's post flow, use the Supabase Emulator Suite. You do **not** need to create a Supabase account or project, configure a real Supabase app, or add a `.env` file to create test posts locally.

The following first three steps are only for contributors who want to connect the app to their own Supabase project. They are not required for the local emulator setup.

### 1. Create a Supabase project

1. Open the [Supabase Console](https://console.supabase.google.com/).
2. Click **Add project**.
3. Enter a project name such as `instalite-demo` or your app name.
4. If prompted, accept Supabase's terms and choose whether to enable Google Analytics.
5. Finish the project creation wizard.

After the project is created, you will be on the Supabase project overview page.

### 2. Register your web app in Supabase

1. In the Supabase console, click the web icon (`</>`) under your project.
2. Give your app a name, for example `InstaLite Web`.
3. Supabase may ask whether to set up Supabase Hosting. For this project, you can skip it if you will use the included local server or deploy later.
4. Supabase will generate a configuration object similar to:

```js
const supabaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-project.supabaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.supabasestorage.app',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abc123def456'
};

export {supabaseConfig};
```

Copy this object carefully. This is the configuration your frontend uses.

### 3. Update the app's Supabase config

Open `.env` and replace the demo values with your real Supabase values:

```js
export const supabaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-project.supabaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.supabasestorage.app',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abc123def456',
};

export { supabaseConfig};
```

Important:
- This file is used by the browser client.
- These values are not private API keys in the same sense as a backend secret.
- Do not store service account credentials, private keys, admin SDK config, or other privileged secrets in this file.

### Run the emulators and create a test post

The repo is already configured to run Supabase Auth, Postgres, and Storage locally with the demo project. You can create a test account, sign in, and create posts (including uploading an image) without connecting to a live Supabase project.

1. Install the project dependencies from the project folder:

   ```bash
   npm install
   ```

2. In one terminal, start the Supabase local development:

   ```bash
   npm run emulators
   ```

   The first start may download emulator files. Keep this terminal open while you use the app. The emulators require Java.

3. In a second terminal, start the app:

   ```bash
   npm start
   ```

4. Open <http://localhost:3000/?emulator=1>, create an account in the app, sign in, and use the create-post control to share a test image and caption.

The Emulator UI is available at <http://localhost:4000>. Emulator data is local and disposable; it is not uploaded to or copied into your Supabase project. The placeholder values in `.env` are intended for this emulator workflow.

To use a real Supabase project instead, completing the first three steps above is only the client-config portion; the real project's Authentication, Postgres, Storage, and Security Rules must also be configured before live posting will work. Never commit service-account files, private keys, or other privileged credentials.

### Fixing Storage row-level security errors

If sharing a post reports `new row violates row-level security policy`, the image upload was rejected before the post row could be created. The upload policy is intentionally limited to authenticated users writing to `post-images` under `posts/{their-user-id}/...`; do not disable row-level security or make uploads public. If email confirmation is enabled, confirm the account and sign in before sharing: a newly created account without a Supabase session is not authenticated yet. If the error persists, inspect the active Storage INSERT policy in the SQL Editor for the same project configured in `.env` before changing policies. The setup script in `supabase/schema.sql` is safe to rerun; its Realtime publication step checks membership before adding `public.posts`.

### Fixing signup email rate limits

If signup displays `email rate limit exceeded` or an HTTP 429 response, Supabase is limiting email sends for the project; this is separate from image uploads and Storage policies. Stop repeating signup or confirmation requests and wait before trying again. If an account may already have been created, use **Sign in** instead. For ongoing development, configure a custom SMTP provider or review the project's Authentication email rate limits in the Supabase Dashboard. The app reports this as a signup email limit and does not try to bypass Supabase throttling.

## Data model

Postgres collection `posts` contains documents with:

```text
userId       Supabase Auth UID of the author
username     Author display name
caption      Post caption (up to 500 characters)
imageUrl     Supabase Storage download URL
imagePath    Storage path: posts/{userId}/{generated-filename}
timestamp    Postgres server timestamp
```

Photos are stored under `posts/{userId}/{generated-filename}`. Storage Rules limit uploads to the authenticated owner's folder, supported image MIME types, and 5 MB. Postgres Rules allow public feed reads and authenticated post creation only; post edits and deletes are disabled in this starter.

## Project structure

```text
instalite/
├── public/
│   ├── index.html
│   ├── style.css
│   ├── supabase-app.js
│   └── .env.example
├── postgres.rules
├── storage.rules
├── supabase.json
├── postgres.indexes.json
├── server.js
├── package.json
└── test/
    └── server.test.js
```

## Workshop contribution ideas

Good follow-up issues include likes, comments, saved posts, story playback, profile editing, and avatar uploads. These can build on the Supabase setup; include Security Rules and tests whenever an issue adds a new collection or changes what users may read or write.
