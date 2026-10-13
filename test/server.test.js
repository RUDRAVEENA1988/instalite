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

test('Express serves the Supabase-enabled page and frontend assets', async () => {
  const pageResponse = await fetch(`${baseUrl}/`);
  const page = await pageResponse.text();
  const stylesheetResponse = await fetch(`${baseUrl}/style.css`);
  const appScriptResponse = await fetch(`${baseUrl}/supabase-app.js`);
  const configResponse = await fetch(`${baseUrl}/api/config`);

  assert.equal(pageResponse.status, 200);
  assert.match(page, /type="module" src="\/supabase-app\.js"/);
  assert.match(page, /id="auth-form"/);
  assert.match(page, /id="create-post-form"/);
  assert.equal(stylesheetResponse.status, 200);
  assert.equal(appScriptResponse.status, 200);
  assert.equal(configResponse.status, 200);
  assert.deepEqual(await configResponse.json(), { url: '', anonKey: '' });

  const appScript = await appScriptResponse.text();
  assert.match(appScript, /supabase\.auth/);
  assert.match(appScript, /postgres_changes/);
  assert.match(appScript, /storage\.from\('post-images'\)/);
  assert.match(appScript, /from\('posts'\)/);
  assert.doesNotMatch(appScript, /fetch\(['"]\/api\/posts/);
});

test('The server no longer exposes the removed in-memory posts API', async () => {
  const response = await fetch(`${baseUrl}/api/posts`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Not found' });
});

test('Supabase schema requires authenticated post creation and owner-scoped photo uploads', async () => {
  const schema = await fs.readFile(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');

  assert.match(schema, /enable row level security/i);
  assert.match(schema, /create table if not exists public\.profiles/);
  assert.match(schema, /on_auth_user_created/);
  assert.match(schema, /auth\.users/);
  assert.match(schema, /auth\.uid\(\)\) = user_id/);
  assert.match(schema, /post-images/);
  assert.match(schema, /storage\.foldername\(name\).*auth\.uid/);
});
