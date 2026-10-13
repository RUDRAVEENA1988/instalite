const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { after, before, test } = require('node:test');
const app = require('../server');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('Express serves the Firebase-enabled page and frontend assets', async () => {
  const pageResponse = await fetch(`${baseUrl}/`);
  const page = await pageResponse.text();
  const stylesheetResponse = await fetch(`${baseUrl}/style.css`);
  const appScriptResponse = await fetch(`${baseUrl}/firebase-app.js`);
  const configResponse = await fetch(`${baseUrl}/firebase-config.js`);

  assert.equal(pageResponse.status, 200);
  assert.match(page, /type="module" src="\/firebase-app\.js"/);
  assert.match(page, /id="auth-form"/);
  assert.match(page, /id="create-post-form"/);
  assert.equal(stylesheetResponse.status, 200);
  assert.equal(appScriptResponse.status, 200);
  assert.equal(configResponse.status, 200);

  const appScript = await appScriptResponse.text();
  assert.match(appScript, /createUserWithEmailAndPassword/);
  assert.match(appScript, /onSnapshot/);
  assert.match(appScript, /uploadBytes/);
  assert.match(appScript, /addDoc/);
  assert.doesNotMatch(appScript, /fetch\(['"]\/api\/posts/);
});

test('The server no longer exposes the removed in-memory posts API', async () => {
  const response = await fetch(`${baseUrl}/api/posts`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Not found' });
});

test('Firebase rules require authenticated post creation and owner-scoped photo uploads', async () => {
  const firestoreRules = await fs.readFile(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const storageRules = await fs.readFile(path.join(__dirname, '..', 'storage.rules'), 'utf8');

  assert.match(firestoreRules, /allow read: if true/);
  assert.match(firestoreRules, /request\.auth\.uid/);
  assert.match(firestoreRules, /allow update, delete: if false/);
  assert.match(storageRules, /request\.auth\.uid == userId/);
  assert.match(storageRules, /request\.resource\.size <= 5 \* 1024 \* 1024/);
  assert.match(storageRules, /image\/\(jpeg\|png\|webp\)/);
});
