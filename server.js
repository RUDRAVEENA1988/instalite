const express = require('express');
const { randomUUID } = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, 'public');
const uploadDirectory = path.join(publicDirectory, 'uploads');
const temporaryUploadDirectory = path.join(uploadDirectory, '.tmp');
const maximumImageSize = 5 * 1024 * 1024;
const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

fs.mkdirSync(temporaryUploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: temporaryUploadDirectory,
    filename: (request, file, callback) => callback(null, randomUUID()),
  }),
  limits: {
    fileSize: maximumImageSize,
    files: 1,
    fields: 2,
    parts: 3,
  },
  fileFilter: (request, file, callback) => {
    if (!supportedImageTypes.has(file.mimetype)) {
      const error = new Error('Only JPEG, PNG, and WebP images are supported.');
      error.code = 'UNSUPPORTED_FILE_TYPE';
      callback(error);
      return;
    }

    callback(null, true);
  },
});

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
app.use(express.static(publicDirectory));

app.get('/api/posts', (request, response) => {
  response.status(200).json(posts);
});

app.post('/api/posts', upload.single('image'), async (request, response) => {
  const rejectRequest = async (status, message) => {
    if (request.file) {
      await removeUploadedFile(request.file.path);
    }

    return response.status(status).json({ error: message });
  };

  const { username, caption } = request.body || {};

  if (typeof username !== 'string' || typeof caption !== 'string') {
    return rejectRequest(400, 'Username and caption are required.');
  }

  const trimmedUsername = username.trim();
  const trimmedCaption = caption.trim();

  if (!trimmedUsername || !trimmedCaption) {
    return rejectRequest(400, 'Username and caption cannot be empty.');
  }

  if (trimmedUsername.length > 30) {
    return rejectRequest(400, 'Username must be 30 characters or fewer.');
  }

  if (trimmedCaption.length > 500) {
    return rejectRequest(400, 'Caption must be 500 characters or fewer.');
  }

  if (!request.file) {
    return response.status(400).json({ error: 'Choose a photo to upload.' });
  }

  const uploadedFile = request.file;
  let finalImagePath;

  try {
    const fileContents = await fs.promises.readFile(uploadedFile.path);
    const imageType = identifyImageType(fileContents);

    if (!imageType || imageType.mimeType !== uploadedFile.mimetype) {
      await removeUploadedFile(uploadedFile.path);
      return response.status(400).json({
        error: 'The uploaded file is not a valid JPEG, PNG, or WebP image.',
      });
    }

    const filename = `${path.basename(uploadedFile.filename)}${imageType.extension}`;
    const imagePath = path.join(uploadDirectory, filename);
    await fs.promises.rename(uploadedFile.path, imagePath);
    finalImagePath = imagePath;

    const post = {
      id: randomUUID(),
      username: trimmedUsername,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80',
      imageUrl: `/uploads/${filename}`,
      caption: trimmedCaption,
      timestamp: new Date().toISOString(),
      likes: 0,
    };

    posts.unshift(post);
    return response.status(201).json(post);
  } catch (error) {
    if (finalImagePath) {
      await removeUploadedFile(finalImagePath);
    } else if (request.file) {
      await removeUploadedFile(request.file.path);
    }

    throw error;
  }
});

app.use((request, response) => {
  response.status(404).json({ error: 'Not found' });
});

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'Request body must contain valid JSON.' });
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return response.status(413).json({ error: 'Photo must be 5 MB or smaller.' });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return response.status(400).json({ error: 'Upload one photo using the "image" field.' });
    }

    return response.status(400).json({ error: 'The photo upload could not be processed.' });
  }

  if (error.code === 'UNSUPPORTED_FILE_TYPE') {
    return response.status(415).json({ error: error.message });
  }

  console.error(error);
  return response.status(500).json({ error: 'Something went wrong' });
});

function identifyImageType(contents) {
  if (
    contents.length >= 3
    && contents[0] === 0xff
    && contents[1] === 0xd8
    && contents[2] === 0xff
  ) {
    return { mimeType: 'image/jpeg', extension: '.jpg' };
  }

  if (
    contents.length >= 8
    && contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mimeType: 'image/png', extension: '.png' };
  }

  if (
    contents.length >= 12
    && contents.toString('ascii', 0, 4) === 'RIFF'
    && contents.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: '.webp' };
  }

  return null;
}

async function removeUploadedFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

if (require.main === module) {
  app.listen(port, () => {
    console.log(`InstaLite server is running at http://localhost:${port}`);
  });
}

module.exports = app;
