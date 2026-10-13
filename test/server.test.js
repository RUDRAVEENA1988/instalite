const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { after, before, test } = require('node:test');
const app = require('../server');

let server;
let baseUrl;
const uploadedImageUrls = [];
const uploadsDirectory = path.join(__dirname, '..', 'public', 'uploads');

function createJpegFile(name = 'photo.jpg', type = 'image/jpeg') {
  return new File([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0xff, 0xd9]),
  ], name, { type });
}

function createPostForm({ username = 'workshop.user', caption = 'A little photo.', file } = {}) {
  const form = new FormData();
  form.set('username', username);
  form.set('caption', caption);

  if (file) {
    form.set('image', file);
  }

  return form;
}

async function uploadPost(options) {
  return fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    body: createPostForm(options),
  });
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  await Promise.all(uploadedImageUrls.map((imageUrl) => (
    fs.unlink(path.join(uploadsDirectory, path.basename(imageUrl))).catch((error) => {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    })
  )));
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
  assert.match(page, /name="image" type="file" accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(page, /id="upload-dropzone"/);
  assert.match(page, /id="upload-preview"/);
  assert.match(page, /src="\/script\.js"/);
  assert.equal(stylesheetResponse.status, 200);
  assert.equal(scriptResponse.status, 200);
  const script = await scriptResponse.text();
  assert.match(script, /fetch\('\/api\/posts'/);
  assert.match(script, /body: formData/);
  assert.doesNotMatch(script, /headers:\s*\{\s*['"]Content-Type['"]/);
});

test('POST /api/posts uploads a valid image and returns its public URL', async () => {
  const image = createJpegFile('../../photo.jpg');
  const response = await uploadPost({
    username: '  workshop.user  ',
    caption: '  A little workshop moment.  ',
    file: image,
  });
  const post = await response.json();

  assert.equal(response.status, 201);
  assert.equal(post.username, 'workshop.user');
  assert.match(post.imageUrl, /^\/uploads\/[0-9a-f-]+\.jpg$/);
  assert.equal(post.caption, 'A little workshop moment.');
  assert.equal(post.likes, 0);
  assert.ok(post.id);
  assert.ok(!Number.isNaN(Date.parse(post.timestamp)));
  assert.equal(Object.hasOwn(post, 'path'), false);
  uploadedImageUrls.push(post.imageUrl);

  const imageResponse = await fetch(`${baseUrl}${post.imageUrl}`);
  assert.equal(imageResponse.status, 200);
  assert.match(imageResponse.headers.get('content-type'), /image\/jpeg/);
  assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), Buffer.from(await image.arrayBuffer()));

  const feedResponse = await fetch(`${baseUrl}/api/posts`);
  const feed = await feedResponse.json();
  assert.equal(feed[0].id, post.id);
  assert.equal(feed[0].imageUrl, post.imageUrl);
});

test('POST /api/posts rejects missing images and invalid form fields', async () => {
  const missingImageResponse = await uploadPost({ username: 'user', caption: 'Caption.' });
  assert.equal(missingImageResponse.status, 400);
  assert.match((await missingImageResponse.json()).error, /photo/i);

  const missingUsernameResponse = await uploadPost({
    username: ' ',
    caption: 'Caption.',
    file: createJpegFile(),
  });
  assert.equal(missingUsernameResponse.status, 400);
  assert.match((await missingUsernameResponse.json()).error, /username/i);
  assert.deepEqual(await fs.readdir(path.join(uploadsDirectory, '.tmp')), []);

  const longCaptionResponse = await uploadPost({
    username: 'user',
    caption: 'x'.repeat(501),
    file: createJpegFile(),
  });
  assert.equal(longCaptionResponse.status, 400);
  assert.match((await longCaptionResponse.json()).error, /500 characters/i);
  assert.deepEqual(await fs.readdir(path.join(uploadsDirectory, '.tmp')), []);
});

test('POST /api/posts rejects unsupported and signature-mismatched images', async () => {
  const unsupportedResponse = await uploadPost({
    username: 'user',
    caption: 'Caption.',
    file: new File(['not an image'], 'notes.txt', { type: 'text/plain' }),
  });
  assert.equal(unsupportedResponse.status, 415);
  assert.match((await unsupportedResponse.json()).error, /JPEG, PNG, and WebP/i);

  const fakeImageResponse = await uploadPost({
    username: 'user',
    caption: 'Caption.',
    file: new File(['not an image'], 'photo.jpg', { type: 'image/jpeg' }),
  });
  assert.equal(fakeImageResponse.status, 400);
  assert.match((await fakeImageResponse.json()).error, /not a valid/i);
  assert.deepEqual(await fs.readdir(path.join(uploadsDirectory, '.tmp')), []);
});

test('POST /api/posts rejects images larger than 5 MB', async () => {
  const oversizedResponse = await uploadPost({
    username: 'user',
    caption: 'Caption.',
    file: new File([Buffer.alloc(5 * 1024 * 1024 + 1, 0)], 'large.jpg', { type: 'image/jpeg' }),
  });

  assert.equal(oversizedResponse.status, 413);
  assert.match((await oversizedResponse.json()).error, /5 MB/i);
  assert.deepEqual(await fs.readdir(path.join(uploadsDirectory, '.tmp')), []);
});

test('POST /api/posts stores PNG and WebP images with signature-verified extensions', async () => {
  const pngResponse = await uploadPost({
    username: 'user',
    caption: 'PNG photo.',
    file: new File([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ], 'photo.jpg', { type: 'image/png' }),
  });
  const pngPost = await pngResponse.json();
  assert.equal(pngResponse.status, 201);
  assert.match(pngPost.imageUrl, /^\/uploads\/[0-9a-f-]+\.png$/);
  uploadedImageUrls.push(pngPost.imageUrl);

  const webpResponse = await uploadPost({
    username: 'user',
    caption: 'WebP photo.',
    file: new File([
      Buffer.from('RIFF\x04\x00\x00\x00WEBP', 'ascii'),
    ], 'photo.png', { type: 'image/webp' }),
  });
  const webpPost = await webpResponse.json();
  assert.equal(webpResponse.status, 201);
  assert.match(webpPost.imageUrl, /^\/uploads\/[0-9a-f-]+\.webp$/);
  uploadedImageUrls.push(webpPost.imageUrl);
});
