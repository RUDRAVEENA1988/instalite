import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {
  connectStorageEmulator,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js';
import { firebaseConfig } from './firebase-config.js';

const feedPosts = document.querySelector('#feed-posts');
const todayDate = document.querySelector('#today-date');
const authDialog = document.querySelector('#auth-dialog');
const authForm = document.querySelector('#auth-form');
const authFeedback = document.querySelector('#auth-feedback');
const authUsernameField = document.querySelector('#auth-username-field');
const authUsernameInput = document.querySelector('#auth-username');
const authTitle = document.querySelector('#auth-dialog-title');
const authSubmit = document.querySelector('#submit-auth');
const authModeHint = document.querySelector('#auth-mode-hint');
const authModeToggle = document.querySelector('#toggle-auth-mode');
const createDialog = document.querySelector('#create-dialog');
const createPostForm = document.querySelector('#create-post-form');
const createPostFeedback = document.querySelector('#create-post-feedback');
const postSuccessToast = document.querySelector('#post-success-toast');
const imageInput = document.querySelector('#post-image');
const uploadDropzone = document.querySelector('#upload-dropzone');
const uploadPreview = document.querySelector('#upload-preview');
const uploadPreviewImage = document.querySelector('#upload-preview-image');
const uploadPreviewName = document.querySelector('#upload-preview-name');
const uploadPreviewSize = document.querySelector('#upload-preview-size');
const authButton = document.querySelector('#auth-button');
const profileUsername = document.querySelector('#profile-username');
const profileSubtitle = document.querySelector('#profile-subtitle');
const maximumImageSize = 5 * 1024 * 1024;
const supportedImageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
let currentUser = null;
let authMode = 'sign-in';
let db;
let unsubscribePosts;
let previewUrl;
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
  likes.textContent = '0 likes';

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
    retryButton.addEventListener('click', listenForPosts);
    messageBox.append(retryButton);
  }

  feedPosts.replaceChildren(messageBox);
}

function listenForPosts() {
  unsubscribePosts?.();
  showFeedMessage('Finding your little moments…', 'loading');

  const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(30));

  unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
    if (snapshot.empty) {
      showFeedMessage('Your feed is taking a little breath. Check back soon.', 'empty');
      return;
    }

    const posts = snapshot.docs.map((postDocument) => {
      const post = postDocument.data();
      const timestamp = post.timestamp?.toDate?.();

      return {
        ...post,
        id: postDocument.id,
        timestamp: timestamp ? timestamp.toISOString() : '',
      };
    });

    feedPosts.replaceChildren(...posts.map(createPostCard));
  }, (error) => {
    console.error('Unable to subscribe to the InstaLite feed:', error);
    showFeedMessage('Your feed could not load. Check Firebase setup and try again.', 'error', true);
  });
}

function setAuthMode(mode) {
  authMode = mode;
  const creatingAccount = authMode === 'sign-up';

  authTitle.textContent = creatingAccount ? 'Create an account' : 'Sign in';
  authSubmit.textContent = creatingAccount ? 'Create account' : 'Sign in';
  authUsernameField.hidden = !creatingAccount;
  authUsernameInput.required = creatingAccount;
  authUsernameInput.autocomplete = creatingAccount ? 'nickname' : 'off';
  authModeHint.textContent = creatingAccount ? 'Already have an account?' : 'New here?';
  authModeToggle.textContent = creatingAccount ? 'Sign in' : 'Create an account';
  document.querySelector('#auth-password').autocomplete = creatingAccount ? 'new-password' : 'current-password';
  authFeedback.textContent = '';
}

function openAuthDialog() {
  authFeedback.textContent = '';
  authDialog.showModal();
  (authMode === 'sign-up' ? authUsernameInput : document.querySelector('#auth-email')).focus();
}

function openCreatePostDialog() {
  createPostFeedback.textContent = '';

  if (!currentUser) {
    setAuthMode('sign-in');
    openAuthDialog();
    authFeedback.textContent = 'Sign in or create an account before sharing a post.';
    return;
  }

  createDialog.showModal();
}

function clearImagePreview() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
  }

  imageInput.value = '';
  uploadPreview.hidden = true;
  uploadPreviewImage.removeAttribute('src');
  uploadPreviewName.textContent = '';
  uploadPreviewSize.textContent = '';
  uploadDropzone.hidden = false;
}

function previewSelectedImage(file) {
  createPostFeedback.textContent = '';

  if (!file) {
    clearImagePreview();
    return;
  }

  if (!supportedImageTypes.has(file.type)) {
    clearImagePreview();
    createPostFeedback.textContent = 'Choose a JPEG, PNG, or WebP image.';
    return;
  }

  if (file.size > maximumImageSize) {
    clearImagePreview();
    createPostFeedback.textContent = 'Choose an image that is 5 MB or smaller.';
    return;
  }

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }

  previewUrl = URL.createObjectURL(file);
  uploadPreviewImage.src = previewUrl;
  uploadPreviewName.textContent = file.name;
  uploadPreviewSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  uploadPreview.hidden = false;
  uploadDropzone.hidden = true;
}

function showSuccessToast(message) {
  window.clearTimeout(toastTimeout);
  postSuccessToast.textContent = message;
  postSuccessToast.hidden = false;
  toastTimeout = window.setTimeout(() => {
    postSuccessToast.hidden = true;
  }, 4000);
}

function updateSignedInProfile(user) {
  currentUser = user;
  const username = user?.displayName || user?.email?.split('@')[0] || 'your.name';
  const signedIn = Boolean(user);

  authButton.querySelector('span').textContent = signedIn ? 'Sign out' : 'Sign in';
  authButton.setAttribute('aria-label', signedIn ? 'Sign out' : 'Sign in');
  profileUsername.textContent = username;
  profileSubtitle.textContent = user?.email || 'Sign in to share a moment';
  document.querySelector('#open-auth-mobile').setAttribute('aria-label', signedIn ? 'Sign out' : 'Sign in');
}

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];
const useEmulators = new URLSearchParams(window.location.search).has('emulator');
const configIsReady = requiredConfigKeys.every((key) => (
  typeof firebaseConfig[key] === 'string'
  && firebaseConfig[key].length > 0
)) && firebaseConfig.apiKey !== 'demo-api-key';

if (todayDate) {
  todayDate.textContent = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

if (!configIsReady && !useEmulators) {
  showFeedMessage('Firebase is not configured. Add your Firebase web app config to public/firebase-config.js.', 'error');
  authButton.disabled = true;
  document.querySelector('#open-create-post').disabled = true;
  document.querySelector('#open-create-post-mobile').disabled = true;
  document.querySelector('#open-auth-mobile').disabled = true;
} else {
  const firebaseApp = initializeApp({
    ...firebaseConfig,
    projectId: useEmulators ? 'demo-instalite' : firebaseConfig.projectId,
  });
  const auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);

  if (useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  }

  document.querySelector('#open-create-post').addEventListener('click', openCreatePostDialog);
  document.querySelector('#open-create-post-mobile').addEventListener('click', openCreatePostDialog);
  document.querySelector('#close-create-post').addEventListener('click', () => createDialog.close());
  document.querySelector('#close-auth').addEventListener('click', () => authDialog.close());
  authModeToggle.addEventListener('click', () => setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in'));
  authButton.addEventListener('click', async () => {
    if (!currentUser) {
      setAuthMode('sign-in');
      openAuthDialog();
      return;
    }

    try {
      await signOut(auth);
      showSuccessToast('You have signed out.');
    } catch (error) {
      console.error('Unable to sign out of InstaLite:', error);
      openAuthDialog();
      authFeedback.textContent = error.message;
    }
  });
  document.querySelector('#open-auth-mobile').addEventListener('click', () => {
    if (currentUser) {
      authButton.click();
      return;
    }

    setAuthMode('sign-in');
    openAuthDialog();
  });

  onAuthStateChanged(auth, updateSignedInProfile, (error) => {
    console.error('Unable to read the InstaLite sign-in state:', error);
    authFeedback.textContent = 'Your sign-in state could not be loaded. Refresh and try again.';
  });

  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authFeedback.textContent = '';
    authSubmit.disabled = true;

    const email = authForm.elements.email.value.trim();
    const password = authForm.elements.password.value;
    const displayName = authUsernameInput.value.trim();

    if (authMode === 'sign-up' && (!displayName || displayName.length > 30)) {
      authFeedback.textContent = 'Enter a display name between 1 and 30 characters.';
      authSubmit.disabled = false;
      return;
    }

    try {
      if (authMode === 'sign-up') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName });
        updateSignedInProfile(credential.user);
        authDialog.close();
        authForm.reset();
        setAuthMode('sign-in');
        showSuccessToast('Your account is ready.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        authDialog.close();
        authForm.reset();
        showSuccessToast('Welcome back.');
      }
    } catch (error) {
      console.error('Unable to authenticate with InstaLite:', error);
      authFeedback.textContent = error.message;
    } finally {
      authSubmit.disabled = false;
    }
  });

  createPostForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    createPostFeedback.textContent = '';

    const caption = createPostForm.elements.caption.value.trim();
    const [image] = imageInput.files;

    if (!currentUser) {
      createPostFeedback.textContent = 'Sign in before sharing a post.';
      return;
    }

    if (!caption || caption.length > 500 || !image || image.size === 0) {
      createPostFeedback.textContent = 'Add a caption and choose a photo before sharing.';
      return;
    }

    if (!supportedImageTypes.has(image.type)) {
      createPostFeedback.textContent = 'Choose a JPEG, PNG, or WebP image.';
      imageInput.focus();
      return;
    }

    if (image.size > maximumImageSize) {
      createPostFeedback.textContent = 'Choose an image that is 5 MB or smaller.';
      imageInput.focus();
      return;
    }

    const submitButton = document.querySelector('#submit-create-post');
    submitButton.disabled = true;
    submitButton.textContent = 'Uploading…';
    const extension = supportedImageTypes.get(image.type);
    const imagePath = `posts/${currentUser.uid}/${crypto.randomUUID()}.${extension}`;
    const imageRef = ref(storage, imagePath);
    let imageUploaded = false;

    try {
      await uploadBytes(imageRef, image, { contentType: image.type });
      imageUploaded = true;
      const imageUrl = await getDownloadURL(imageRef);
      const username = (currentUser.displayName || currentUser.email?.split('@')[0] || 'instalite-user').slice(0, 30);

      await addDoc(collection(db, 'posts'), {
        userId: currentUser.uid,
        username,
        caption,
        imageUrl,
        imagePath,
        timestamp: serverTimestamp(),
      });

      createPostForm.reset();
      clearImagePreview();
      createDialog.close();
      showSuccessToast('Your moment was shared.');
    } catch (error) {
      if (imageUploaded) {
        try {
          await deleteObject(imageRef);
        } catch (cleanupError) {
          console.error('Unable to clean up an uploaded InstaLite photo:', cleanupError);
        }
      }

      console.error('Unable to upload an InstaLite post:', error);
      createPostFeedback.textContent = error.message || 'Your photo could not be uploaded. Please try again.';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Share post';
    }
  });

  imageInput.addEventListener('change', () => previewSelectedImage(imageInput.files[0]));
  document.querySelector('#remove-upload').addEventListener('click', clearImagePreview);

  uploadDropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      imageInput.click();
    }
  });

  uploadDropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadDropzone.classList.add('upload-dropzone--dragging');
  });

  uploadDropzone.addEventListener('dragleave', () => {
    uploadDropzone.classList.remove('upload-dropzone--dragging');
  });

  uploadDropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadDropzone.classList.remove('upload-dropzone--dragging');

    const [file] = event.dataTransfer.files;

    if (!file) {
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    imageInput.files = transfer.files;
    previewSelectedImage(file);
  });

  setAuthMode('sign-in');
  listenForPosts();
}
