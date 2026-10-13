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

## Connect a Firebase project

To use a real Firebase project:

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a Web app in that project and copy its Firebase configuration object.
3. Replace the demo values in `public/firebase-config.js` with the values from the Web app config.
4. In **Authentication → Sign-in method**, enable **Email/Password**.
5. Create a **Cloud Firestore** database.
6. Create the **Cloud Storage** bucket.
7. Install/login to the Firebase CLI and associate this checkout with your project:

   ```bash
   npx firebase-tools login
   npx firebase-tools use --add
   ```

8. Deploy the included Firestore and Storage rules before sharing the app:

   ```bash
   npx firebase-tools deploy --only firestore:rules,storage
   ```

Then run `npm start` and open <http://localhost:3000/> **without** `?emulator=1`.

The web app configuration is public client configuration, not a server secret. Do not put a service-account JSON file, private key, or Admin SDK credentials in this repository. Access control is enforced by the included Security Rules, not by hiding the web config. Review the rules before changing them; posts and uploaded images are publicly readable, while creating a post/photo requires an authenticated user.

For local-only work, the `demo-instalite` project configuration is prefilled. The emulator rules are the same checked-in rules used for deployment.

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
