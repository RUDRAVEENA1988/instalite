const feedPosts = document.querySelector('#feed-posts');
const todayDate = document.querySelector('#today-date');
const createDialog = document.querySelector('#create-dialog');
const createPostForm = document.querySelector('#create-post-form');
const createPostFeedback = document.querySelector('#create-post-feedback');
const postSuccessToast = document.querySelector('#post-success-toast');
let toastTimeout;

function formatTimeAgo(timestamp) {
  const postDate = new Date(timestamp);

  if (Number.isNaN(postDate.getTime())) {
    return 'Shared on an earlier day';
  }

  const minutesAgo = Math.max(0, Math.floor((Date.now() - postDate.getTime()) / 60000));

  if (minutesAgo < 1) {
    return 'Just now';
  }

  if (minutesAgo < 60) {
    return `${minutesAgo}m ago`;
  }

  const hoursAgo = Math.floor(minutesAgo / 60);

  if (hoursAgo < 24) {
    return `${hoursAgo}h ago`;
  }

  const daysAgo = Math.floor(hoursAgo / 24);
  return daysAgo < 7 ? `${daysAgo}d ago` : postDate.toLocaleDateString();
}

function createIcon(pathMarkup, className = '') {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('class', className);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathMarkup);
  icon.append(path);

  return icon;
}

function createPostCard(post) {
  const card = document.createElement('article');
  card.className = 'post-card';

  const header = document.createElement('header');
  header.className = 'post-card__header';

  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.width = 38;
  avatar.height = 38;
  avatar.alt = '';
  avatar.loading = 'lazy';
  avatar.src = post.avatarUrl || '/images/default-avatar.svg';

  const identity = document.createElement('div');
  identity.className = 'post-card__identity';

  const username = document.createElement('strong');
  username.textContent = post.username;
  identity.append(username);

  const location = document.createElement('span');
  location.className = 'post-card__location';
  location.textContent = 'A moment worth keeping';
  identity.append(location);

  const moreButton = document.createElement('button');
  moreButton.className = 'post-card__more';
  moreButton.type = 'button';
  moreButton.disabled = true;
  moreButton.setAttribute('aria-label', 'More post options (coming soon)');
  moreButton.textContent = '···';

  header.append(avatar, identity, moreButton);

  const photo = document.createElement('img');
  photo.className = 'post-card__photo';
  photo.src = post.imageUrl;
  photo.alt = `Photo shared by ${post.username}`;
  photo.loading = 'lazy';

  const actions = document.createElement('div');
  actions.className = 'post-card__actions';

  const likeButton = document.createElement('button');
  likeButton.className = 'post-action post-action--liked';
  likeButton.type = 'button';
  likeButton.disabled = true;
  likeButton.setAttribute('aria-label', 'Likes (not interactive yet)');
  likeButton.append(createIcon('M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z'));

  const commentButton = document.createElement('button');
  commentButton.className = 'post-action';
  commentButton.type = 'button';
  commentButton.disabled = true;
  commentButton.setAttribute('aria-label', 'Comments (coming soon)');
  commentButton.append(createIcon('M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z'));

  const bookmarkButton = document.createElement('button');
  bookmarkButton.className = 'post-action post-action--save';
  bookmarkButton.type = 'button';
  bookmarkButton.disabled = true;
  bookmarkButton.setAttribute('aria-label', 'Save post (coming soon)');
  bookmarkButton.append(createIcon('M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z'));

  actions.append(likeButton, commentButton, bookmarkButton);

  const details = document.createElement('div');
  details.className = 'post-card__details';

  const likes = document.createElement('p');
  likes.className = 'post-card__likes';
  const likeCount = Number.isFinite(Number(post.likes)) ? Number(post.likes) : 0;
  likes.textContent = `${likeCount.toLocaleString()} ${likeCount === 1 ? 'like' : 'likes'}`;

  const caption = document.createElement('p');
  caption.className = 'post-card__caption';

  const captionUsername = document.createElement('strong');
  captionUsername.textContent = post.username;

  const captionText = document.createElement('span');
  captionText.textContent = post.caption;
  caption.append(captionUsername, captionText);

  const comments = document.createElement('button');
  comments.className = 'post-card__comments';
  comments.type = 'button';
  comments.disabled = true;
  comments.textContent = 'View comments — coming soon';

  const timestamp = document.createElement('time');
  timestamp.className = 'post-card__timestamp';
  timestamp.dateTime = post.timestamp;
  timestamp.textContent = formatTimeAgo(post.timestamp);

  details.append(likes, caption, comments, timestamp);
  card.append(header, photo, actions, details);

  return card;
}

function showFeedMessage(message, type, showRetry = false) {
  const messageBox = document.createElement('div');
  messageBox.className = `feed-message feed-message--${type}`;
  messageBox.setAttribute('role', type === 'error' ? 'alert' : 'status');

  if (type === 'loading') {
    const spinner = document.createElement('span');
    spinner.className = 'feed-message__spinner';
    spinner.setAttribute('aria-hidden', 'true');
    messageBox.append(spinner);
  } else if (type === 'empty') {
    const sparkle = document.createElement('span');
    sparkle.className = 'feed-message__sparkle';
    sparkle.setAttribute('aria-hidden', 'true');
    sparkle.textContent = '✳';
    messageBox.append(sparkle);
  }

  const messageText = document.createElement('span');
  messageText.textContent = message;
  messageBox.append(messageText);

  if (showRetry) {
    const retryButton = document.createElement('button');
    retryButton.className = 'feed-message__retry';
    retryButton.type = 'button';
    retryButton.textContent = 'Try again';
    retryButton.addEventListener('click', loadPosts);
    messageBox.append(retryButton);
  }

  feedPosts.replaceChildren(messageBox);
}

async function loadPosts() {
  showFeedMessage('Finding your little moments…', 'loading');

  try {
    const response = await fetch('/api/posts');

    if (!response.ok) {
      throw new Error(`Unable to load posts (HTTP ${response.status}).`);
    }

    const posts = await response.json();

    if (!Array.isArray(posts)) {
      throw new Error('The server returned an unexpected posts response.');
    }

    if (posts.length === 0) {
      showFeedMessage('Your feed is taking a little breath. Check back soon.', 'empty');
      return true;
    }

    feedPosts.replaceChildren(...posts.map(createPostCard));
    return true;
  } catch (error) {
    console.error('Unable to load the InstaLite feed:', error);
    showFeedMessage('Your feed could not load. Check your connection and try again.', 'error', true);
    return false;
  }
}

function openCreatePostDialog() {
  createPostFeedback.textContent = '';
  createDialog.showModal();
  createPostForm.elements.username.focus();
}

function showSuccessToast(message) {
  window.clearTimeout(toastTimeout);
  postSuccessToast.textContent = message;
  postSuccessToast.hidden = false;
  toastTimeout = window.setTimeout(() => {
    postSuccessToast.hidden = true;
  }, 4000);
}

document.querySelector('#open-create-post').addEventListener('click', openCreatePostDialog);
document.querySelector('#open-create-post-mobile').addEventListener('click', openCreatePostDialog);
document.querySelector('#close-create-post').addEventListener('click', () => {
  createDialog.close();
});

createPostForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  createPostFeedback.textContent = '';

  const formData = new FormData(createPostForm);
  const postDetails = {
    username: formData.get('username').trim(),
    imageUrl: formData.get('imageUrl').trim(),
    caption: formData.get('caption').trim(),
  };

  if (Object.values(postDetails).some((value) => !value)) {
    createPostFeedback.textContent = 'Please fill in your username, photo URL, and caption.';
    return;
  }

  if (!createPostForm.elements.imageUrl.checkValidity()) {
    createPostFeedback.textContent = 'Enter a valid photo URL starting with http:// or https://.';
    createPostForm.elements.imageUrl.focus();
    return;
  }

  const submitButton = document.querySelector('#submit-create-post');
  submitButton.disabled = true;
  submitButton.textContent = 'Sharing…';

  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postDetails),
    });
    const createdPost = await response.json();

    if (!response.ok) {
      throw new Error(createdPost.error || `Unable to create post (HTTP ${response.status}).`);
    }

    createPostForm.reset();
    createDialog.close();
    showSuccessToast('Your moment was shared.');
    await loadPosts();
  } catch (error) {
    console.error('Unable to create an InstaLite post:', error);
    createPostFeedback.textContent = error.message || 'Your post could not be shared. Please try again.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Share post';
  }
});

if (todayDate) {
  todayDate.textContent = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

loadPosts();
