const assert = require('node:assert/strict');
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

test('GET /api/posts returns the sample posts as JSON', async () => {
  const response = await fetch(`${baseUrl}/api/posts`);
  const posts = await response.json();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.equal(posts.length, 3);
  assert.equal(posts[0].username, 'ava.morgan');
  assert.ok(posts[0].imageUrl);
});

test('Express serves the page, stylesheet, and feed script', async () => {
  const pageResponse = await fetch(`${baseUrl}/`);
  const page = await pageResponse.text();
  const stylesheetResponse = await fetch(`${baseUrl}/style.css`);
  const scriptResponse = await fetch(`${baseUrl}/script.js`);

  assert.equal(pageResponse.status, 200);
  assert.match(page, /id="create-post-form"/);
  assert.match(page, /src="\/script\.js"/);
  assert.equal(stylesheetResponse.status, 200);
  assert.equal(scriptResponse.status, 200);
  assert.match(await scriptResponse.text(), /fetch\('\/api\/posts'/);
});

test('POST /api/posts creates a trimmed post and returns HTTP 201', async () => {
  const response = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: '  workshop.user  ',
      imageUrl: ' https://example.com/photo.jpg ',
      caption: '  A little workshop moment.  ',
    }),
  });
  const post = await response.json();

  assert.equal(response.status, 201);
  assert.equal(post.username, 'workshop.user');
  assert.equal(post.imageUrl, 'https://example.com/photo.jpg');
  assert.equal(post.caption, 'A little workshop moment.');
  assert.equal(post.likes, 0);
  assert.ok(post.id);
  assert.ok(!Number.isNaN(Date.parse(post.timestamp)));

  const feedResponse = await fetch(`${baseUrl}/api/posts`);
  const feed = await feedResponse.json();
  assert.equal(feed[0].id, post.id);
});

test('POST /api/posts rejects missing fields, blank values, invalid URLs, and long captions', async () => {
  const invalidPosts = [
    { username: 'user', imageUrl: 'https://example.com/photo.jpg' },
    { username: ' ', imageUrl: 'https://example.com/photo.jpg', caption: 'caption' },
    { username: 'user', imageUrl: 'ftp://example.com/photo.jpg', caption: 'caption' },
    { username: 'user', imageUrl: 'https://example.com/photo.jpg', caption: 'x'.repeat(501) },
  ];

  for (const invalidPost of invalidPosts) {
    const response = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPost),
    });

    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  }
});

test('POST /api/posts reports malformed JSON with HTTP 400', async () => {
  const response = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"username":',
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Request body must contain valid JSON.',
  });
});
