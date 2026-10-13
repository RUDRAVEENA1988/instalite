# InstaLite

InstaLite is a beginner-friendly, Instagram-inspired photo-sharing app for learning frontend development, Firebase, and open-source collaboration.

## Features

- Responsive Instagram-inspired interface with sample story circles and a live photo feed.
- Firebase Authentication with email/password sign-up and sign-in.
- Firestore stores shared post metadata and updates the feed in real time.
- Firebase Storage stores JPEG, PNG, and WebP photos (up to 5 MB).
- Firestore and Storage Security Rules require sign-in to create posts and scope uploads to their owner.
- Firebase Emulator Suite configuration for local development without a real Firebase project.
- Express serves the app locally; Firebase Hosting can host the same static frontend.
- Likes, comments, saved posts, story playback, and editable profiles are not implemented yet.

## Technology stack

- HTML, CSS, and vanilla JavaScript modules
- Node.js and Express for local static hosting
- Firebase Authentication, Cloud Firestore, Cloud Storage, and Firebase Hosting
- Firebase Local Emulator Suite for local development

## Requirements

- Node.js 20 or newer
- npm
- Java (required by the Firebase emulators)

## Install and run with local emulators

Install the Node dependencies:

```bash
npm install
```

Start the Firebase emulators in one terminal:

```bash
npm run emulators
```

The first emulator run may download emulator binaries. In another terminal, serve the app:

```bash
npm start
```

Open <http://localhost:3000/?emulator=1>. The `emulator=1` query parameter connects the app to the local Auth, Firestore, and Storage emulators using the demo project `demo-instalite`. Do not use this parameter against production.

The Emulator UI is available at <http://localhost:4000>. Emulator data is local and disposable; it is not copied into a Firebase project.

Run the tests with:

```bash
npm test
```

## Firebase setup guide

For local development and trying the app's post flow, use the Firebase Emulator Suite. You do **not** need to create a Firebase account or project, configure a real Firebase app, or add a `.env` file to create test posts locally.

The following first three steps are only for contributors who want to connect the app to their own Firebase project. They are not required for the local emulator setup.

### 1. Create a Firebase project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Enter a project name such as `instalite-demo` or your app name.
4. If prompted, accept Firebase's terms and choose whether to enable Google Analytics.
5. Finish the project creation wizard.

After the project is created, you will be on the Firebase project overview page.

### 2. Register your web app in Firebase

1. In the Firebase console, click the web icon (`</>`) under your project.
2. Give your app a name, for example `InstaLite Web`.
3. Firebase may ask whether to set up Firebase Hosting. For this project, you can skip it if you will use the included local server or deploy later.
4. Firebase will generate a configuration object similar to:

```js
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.firebasestorage.app',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abc123def456'
};
```

Copy this object carefully. This is the configuration your frontend uses.

### 3. Update the app's Firebase config

Open `public/firebase-config.js` and replace the demo values with your real Firebase values:

```js
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.firebasestorage.app',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abc123def456',
};
```

Important:
- This file is used by the browser client.
- These values are not private API keys in the same sense as a backend secret.
- Do not store service account credentials, private keys, admin SDK config, or other privileged secrets in this file.

### 4. Enable Firebase Authentication

This app uses email/password authentication.

1. In the Firebase Console, open **Authentication**.
2. Click **Get started**.
3. Go to the **Sign-in method** tab.
4. Enable **Email/Password**.
5. Save the settings.

This allows users to sign up and sign in using an email and password.

### 5. Create a Firestore database

1. In the Firebase Console, open **Firestore Database**.
2. Click **Create database**.
3. Choose a location close to your users.
4. Start in either:
   - **Production mode** if you are okay with public reads by default and rule-based control, or
   - **Test mode** while learning and testing.
5. Complete the database setup.

This project expects a collection called `posts` and document fields such as:

```text
userId
username
caption
imageUrl
imagePath
timestamp
```

The app reads posts from Firestore in real time and writes new posts as authenticated users create content.

### 6. Create a Cloud Storage bucket

1. Open **Storage** in the Firebase Console.
2. Click **Get started**.
3. Choose a bucket location.
4. Accept the default security settings and finish setup.

This app uploads images to Storage and stores the resulting `imageUrl` and path in Firestore.

### 7. Review the included Security Rules

This project includes the rules files:

- `firestore.rules`
- `storage.rules`

These rules are the app's access-control layer and should be reviewed before using a real project.

The app is designed to allow:
- public read access to posts in the feed
- authenticated users to create a post
- authenticated users to upload only their own images
- no editing or deletion of posts through the frontend

If you are testing with a real Firebase project, deploy the rules before using the app publicly.

### 8. Install the Firebase CLI

If you want to deploy rules or use Firebase hosting, install the Firebase CLI locally:

```bash
npm install -g firebase-tools
```

Then sign in:

```bash
firebase login
```

Connect this repo to your Firebase project:

```bash
firebase use --add
```

When prompted, select your project from the list. This creates a project alias in your local Firebase config.

### 9. Deploy Firebase rules

The project includes rules and configuration files wired in `firebase.json`.

Deploy the rules with:

```bash
firebase deploy --only firestore:rules,storage
```

You can also deploy hosting if you want to publish the frontend:

```bash
firebase deploy
```

### 10. Run the app with a real Firebase project

After updating `public/firebase-config.js` and enabling the required Firebase services, run:

```bash
npm start
```

Then open:

```text
http://localhost:3000/
```

Do not append `?emulator=1` when using a real project. That query parameter tells the app to use the local emulator setup instead of your live Firebase project.

### 11. Run with Firebase Emulator Suite locally

For local development without a real Firebase project, this repo already includes emulator configuration in `firebase.json`.

Start the emulators:

```bash
npm run emulators
```

In another terminal, run the app:

```bash
npm start
```

Then open:

```text
http://localhost:3000/?emulator=1
```

This connects the app to:
- Firebase Auth emulator
- Firestore emulator
- Storage emulator
- Hosting emulator

The Storage emulator returns image URLs from `http://127.0.0.1:9199`; the Firestore rules accept this local URL alongside production Storage URLs. Emulator URLs are local-only and should not be used by a hosted app.

The Firebase UI is available at:

```text
http://localhost:4000
```

This is the easiest way to develop the app locally without paying for or connecting to a real project.

### 12. Understanding the emulator config

`public/firebase-config.js` contains the Firebase web app configuration for non-emulator mode. When `?emulator=1` is present, the app uses the `demo-instalite` project ID and connects to the local emulators without replacing or editing that configuration file.

Without `?emulator=1`, the app connects to the Firebase project configured in `public/firebase-config.js`.

### 13. Important security reminders

- Do not commit private Firebase Admin SDK keys or service-account JSON files.
- Do not put production secrets in public frontend files.
- The Firebase web config is intentionally public and safe to include in client code.
- Security Rules are what enforce who can read or write data.
- Review `firestore.rules` and `storage.rules` before exposing an app to real users.

### 14. Common troubleshooting

#### Firebase Auth errors

- Make sure **Email/Password** is enabled in Authentication.
- Confirm the `apiKey` and `projectId` in `public/firebase-config.js` are correct.
- If using emulators, ensure `?emulator=1` is present.

### Run the emulators and create a test post


The repo is already configured to run Firebase Auth, Firestore, and Storage locally with the demo project. You can create a test account, sign in, and create posts (including uploading an image) without connecting to a live Firebase project.

1. Install the project dependencies from the project folder:

   ```bash
   npm install
   ```

2. In one terminal, start the Firebase emulators:

   ```bash
   npm run emulators
   ```

   The first start may download emulator files. Keep this terminal open while you use the app. The emulators require Java.

3. In a second terminal, start the app:

   ```bash
   npm start
   ```

4. Open <http://localhost:3000/?emulator=1>, create an account in the app, sign in, and use the create-post control to share a test image and caption.

The Emulator UI is available at <http://localhost:4000>. Emulator data is local and disposable; it is not uploaded to or copied into your Firebase project. The placeholder values in `public/firebase-config.js` are intended for this emulator workflow.

To use a real Firebase project instead, completing the first three steps above is only the client-config portion; the real project's Authentication, Firestore, Storage, and Security Rules must also be configured before live posting will work. Never commit service-account files, private keys, or other privileged credentials.

## Data model

Firestore collection `posts` contains documents with:

```text
userId       Firebase Auth UID of the author
username     Author display name
caption      Post caption (up to 500 characters)
imageUrl     Firebase Storage download URL
imagePath    Storage path: posts/{userId}/{generated-filename}
timestamp    Firestore server timestamp
```

Photos are stored under `posts/{userId}/{generated-filename}`. Storage Rules limit uploads to the authenticated owner's folder, supported image MIME types, and 5 MB. Firestore Rules allow public feed reads and authenticated post creation only; post edits and deletes are disabled in this starter.

## Project structure

```text
instalite/
├── public/
│   ├── index.html
│   ├── style.css
│   ├── firebase-app.js
│   └── firebase-config.js
├── firestore.rules
├── storage.rules
├── firebase.json
├── firestore.indexes.json
├── server.js
├── package.json
└── test/
    └── server.test.js
```

## Workshop contribution ideas

Good follow-up issues include likes, comments, saved posts, story playback, profile editing, and avatar uploads. These can build on the Firebase setup; include Security Rules and tests whenever an issue adds a new collection or changes what users may read or write.
