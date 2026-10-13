# InstaLite

InstaLite is a beginner-friendly, Instagram-inspired photo-sharing application built to demonstrate how a browser frontend communicates with a Node.js backend through REST APIs.

## Purpose

This hands-on GitHub workshop project provides a small, understandable starting point for learning how to serve a web page and exchange JSON data between a frontend and an Express server.

## Features

- Responsive, Instagram-inspired interface with navigation, story circles, suggested profiles, and a photo feed.
- Express serves the project frontend from `public/`.
- The browser fetches post data from `GET /api/posts` and builds the feed dynamically.
- Loading, empty, and error states are shown in the feed.
- Three sample posts demonstrate the feed; posts are kept in an in-memory JavaScript array.
- A create-post dialog sends a username, photo URL, and caption to `POST /api/posts`.
- The server validates new posts, assigns an ID and timestamp, and returns them with HTTP 201.
- Successful posts appear at the top of the feed without a page reload.
- Likes, comments, profile links, and stories are illustrative interface elements, not interactive features.

## Technology stack

- HTML5, CSS3, and vanilla JavaScript
- Node.js and Express.js
- REST APIs using HTTP GET and POST
- In-memory JavaScript array; no database

## Project structure

```text
instalite/
├── public/
│   ├── index.html   # Page structure
│   ├── style.css    # Responsive styles
│   └── script.js    # Fetches the feed and submits new posts
├── server.js        # Express server and REST API
├── package.json     # Project metadata and dependencies
├── package-lock.json
├── test/
│   └── server.test.js # REST API tests
├── .gitignore
└── README.md
```

## Installation and setup

Install [Node.js](https://nodejs.org/) (which includes npm), then open a terminal in the project directory and install the dependencies:

```bash
npm install
```

## Run the application

Start the Express server:

```bash
npm start
```

The server listens at <http://localhost:3000> by default. Set the `PORT` environment variable to use a different port.

Run the REST API tests in a separate terminal with:

```bash
npm test
```

## REST API

### `GET /api/posts`

Returns all posts as a JSON array. The initial response contains three sample posts.

Example:

```bash
curl http://localhost:3000/api/posts
```

Each post object includes `id`, `username`, `avatarUrl`, `imageUrl`, `caption`, `timestamp`, and `likes`.

### `POST /api/posts`

Creates a post in memory. `username`, `imageUrl`, and `caption` must be non-empty strings. The username is limited to 30 characters, the caption to 500 characters, and the image URL to 2048 characters; image URLs must use `http://` or `https://`.

Example:

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"ava.morgan\",\"imageUrl\":\"https://example.com/photo.jpg\",\"caption\":\"A little moment worth keeping.\"}"
```

A successful request returns HTTP `201 Created` and the created post, including its generated `id`, ISO 8601 `timestamp`, sample `avatarUrl`, and initial `likes` count of `0`. Invalid input or malformed JSON returns HTTP `400` with a JSON `error` message.

## Current limitations

- Post data is stored only in memory. User-created posts are lost when the server restarts; the three sample posts are reloaded at startup.
- Photos must be provided as publicly accessible URLs; the app does not upload or verify image files.
- Likes, comments, story links, profile links, and suggestions are illustrative interface elements, not interactive features.
- There is no authentication, database, or image-upload support.
- Future improvements may include working likes and comments, user authentication, persistent storage, photo uploads, profiles and following, pagination, and search.

## GitHub workshop

The learner is responsible for creating the GitHub repository, committing this README, and opening a GitHub issue to track the planned like or comment feature. These GitHub actions are intentionally not performed automatically.
