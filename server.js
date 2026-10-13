const express = require('express');
const { randomUUID } = require('crypto');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const posts = [
  {
    id: 'demo-1',
    username: 'ava.morgan',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1080&q=85',
    caption: 'Taking the scenic route this weekend.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 128,
  },
  {
    id: 'demo-2',
    username: 'leo.park',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1080&q=85',
    caption: 'Golden hour never gets old.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 86,
  },
  {
    id: 'demo-3',
    username: 'nina.rivers',
    avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=96&h=96&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1080&q=85',
    caption: 'A little time by the water.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likes: 204,
  },
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/posts', (request, response) => {
  response.status(200).json(posts);
});

app.post('/api/posts', (request, response) => {
  const { username, imageUrl, caption } = request.body || {};

  if (
    typeof username !== 'string'
    || typeof imageUrl !== 'string'
    || typeof caption !== 'string'
  ) {
    return response.status(400).json({
      error: 'Username, image URL, and caption are required.',
    });
  }

  const trimmedUsername = username.trim();
  const trimmedImageUrl = imageUrl.trim();
  const trimmedCaption = caption.trim();

  if (!trimmedUsername || !trimmedImageUrl || !trimmedCaption) {
    return response.status(400).json({
      error: 'Username, image URL, and caption cannot be empty.',
    });
  }

  if (trimmedUsername.length > 30) {
    return response.status(400).json({
      error: 'Username must be 30 characters or fewer.',
    });
  }

  if (trimmedImageUrl.length > 2048) {
    return response.status(400).json({
      error: 'Image URL must be 2048 characters or fewer.',
    });
  }

  let parsedImageUrl;
  try {
    parsedImageUrl = new URL(trimmedImageUrl);
  } catch {
    return response.status(400).json({
      error: 'Enter a valid image URL starting with http:// or https://.',
    });
  }

  if (!['http:', 'https:'].includes(parsedImageUrl.protocol)) {
    return response.status(400).json({
      error: 'Image URL must start with http:// or https://.',
    });
  }

  if (trimmedCaption.length > 500) {
    return response.status(400).json({
      error: 'Caption must be 500 characters or fewer.',
    });
  }

  const post = {
    id: randomUUID(),
    username: trimmedUsername,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80',
    imageUrl: parsedImageUrl.toString(),
    caption: trimmedCaption,
    timestamp: new Date().toISOString(),
    likes: 0,
  };

  posts.unshift(post);
  return response.status(201).json(post);
});

app.use((request, response) => {
  response.status(404).json({ error: 'Not found' });
});

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'Request body must contain valid JSON.' });
  }

  console.error(error);
  return response.status(500).json({ error: 'Something went wrong' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`InstaLite server is running at http://localhost:${port}`);
  });
}

module.exports = app;
