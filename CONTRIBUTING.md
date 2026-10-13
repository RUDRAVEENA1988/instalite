# Contributing to InstaLite

Welcome! This guide is for first-time contributors—even if Git and pull requests are new to you. Follow the steps in order to make a small change and open a pull request.

## Your first pull request in about 30 minutes

The 30-minute estimate assumes you already have a GitHub account, Git, Node.js, and a code editor installed, and that your internet connection is working. Installing software or downloading packages can take longer.

| Time | What you'll do |
| --- | --- |
| 0–5 min | Check that the tools are ready and fork the project |
| 5–10 min | Clone your fork, connect upstream, and create a work branch |
| 10–15 min | Install dependencies (skip this for docs-only changes) |
| 15–22 min | Make one small, focused change |
| 22–25 min | Review your changes and run the relevant test |
| 25–30 min | Push your branch and open a pull request |

For a first contribution, a small documentation or styling improvement is a great choice. You do **not** need to create a Firebase project, add a `.env` file, or start the Firebase emulators just to update documentation or make a simple frontend change.

## Before you start

You will need:

- A [GitHub account](https://github.com/signup).
- [Git](https://git-scm.com/downloads) installed on your computer.
- [Node.js 20 or newer](https://nodejs.org/) and npm. npm is included with Node.js.
- A code editor, such as [Visual Studio Code](https://code.visualstudio.com/).

After installing Git or Node.js, close and reopen your terminal. Open **PowerShell** (Windows) or **Terminal** (macOS/Linux) and check the tools:

```bash
git --version
node --version
npm --version
```

If a command says it is not recognized or not found, install that tool using the link above, restart the terminal, and try again.

## Step 1: Fork InstaLite on GitHub

1. Open the [InstaLite repository](https://github.com/kachamsiddarth/instalite).
2. Sign in to GitHub.
3. Click **Fork** near the top-right of the page.
4. If asked where to create the fork, choose your personal GitHub account.
5. Wait for GitHub to create your copy. The page should now show your username and `/instalite`.

A **fork** is your own copy of the project. You will push your changes to this copy, then ask the original project to accept them with a pull request.

## Step 2: Clone your fork onto your computer

On your fork's GitHub page, click the green **Code** button, choose **HTTPS**, and copy the URL. It should look like `https://github.com/YOUR-USERNAME/instalite.git`.

In your terminal, paste the URL you copied in place of the example below, then run:

```bash
git clone https://github.com/YOUR-USERNAME/instalite.git
cd instalite
```

For example, if your GitHub username is `octocat`, the clone command is:

```bash
git clone https://github.com/octocat/instalite.git
cd instalite
```

`cd instalite` moves the terminal into the project folder. Run the remaining commands from this folder.

## Step 3: Connect your copy to the original project

This is a one-time setup for this local copy. It gives your computer a name for the original repository, called `upstream`:

```bash
git remote add upstream https://github.com/kachamsiddarth/instalite.git
git remote -v
```

The second command should show:

- `origin` — your fork (the URL should contain your GitHub username)
- `upstream` — the original InstaLite repository

## Step 4: Update `main`, then create a branch for your change

Do this **before** creating a work branch. It starts your work from the latest version of the original project:

```bash
git fetch upstream
git switch main
git merge upstream/main
```

Now create a separate branch for your contribution. Replace `docs-fix` with a short name for your change; use lowercase letters and hyphens:

```bash
git switch -c docs-fix
```

Examples:

```bash
git switch -c improve-contributing-guide
git switch -c fix-mobile-spacing
git switch -c clarify-firebase-setup
```

You will make and push your change on this branch—not directly on `main`.

## Step 5: Install the project dependencies (for code changes)

If you are changing or testing code, run this once from the project folder:

```bash
npm install
```

Wait for the command to finish. It may take a few minutes the first time. If it finishes with an error, copy the last part of the error message when asking for help.

For a documentation-only change, you can skip `npm install` and continue to the next step. You can also skip starting the app and running tests for documentation-only changes.

## Step 6: Make one small change

Open the `instalite` folder in your editor. In Visual Studio Code, you can run this from the project folder:

```bash
code .
```

Choose one focused task—for example, clarify a confusing sentence in the documentation, fix a small visual issue, or work on a beginner-friendly issue in the repository. Read the nearby code or documentation before editing, and avoid changing files unrelated to your task.

Save your changes, then see which files changed:

```bash
git status
```

Review the actual changes before sharing them:

```bash
git diff
```

If the diff includes something you did not mean to change, fix that before continuing. Do not add API keys, passwords, `.env` files, or other secrets.

## Step 7: Check your change

For code changes, run the test suite:

```bash
npm test
```

For a documentation-only change, tests are usually unnecessary. For a frontend change, run the app to check it in your browser:

```bash
npm start
```

Open <http://localhost:3000/>. Stop the server when you are done by returning to the terminal and pressing **Ctrl+C**.

The Firebase emulators are only needed when you are changing or testing Firebase behavior. They require Java and may download emulator files the first time, so they can take longer than the 30-minute first-PR target. See the [README setup guide](./README.md#install-and-run-with-local-emulators) if your change needs them. You do not need a real Firebase project for the included local emulator setup.

## Step 8: Commit your change

First, stage only the file or files you intended to change. For example:

```bash
git add CONTRIBUTING.md
```

Use the path of your changed file instead if you edited a different one. Then check what you staged:

```bash
git diff --staged
```

If it looks right, create a commit with a short description:

```bash
git commit -m "Improve first-time contribution guide"
```

If Git asks you to set your name or email, set them for your commits with the name and email you want associated with Git:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Then run the `git commit` command again.

## Step 9: Push your branch to your fork

Push the branch you created. Replace `docs-fix` with your branch name if you chose a different one:

```bash
git push -u origin docs-fix
```

The `-u` option connects your local branch to the branch on your fork. For later updates to this same branch, you can use `git push`.

## Step 10: Open a pull request

1. Open your fork on GitHub. GitHub may show a **Compare & pull request** button after your push; click it.
2. Check the branches at the top of the form:
   - **base repository:** `kachamsiddarth/instalite`
   - **base branch:** `main`
   - **head repository:** your fork
   - **compare branch:** your work branch, such as `docs-fix`
3. Give the pull request a clear title, such as `Improve first-time contribution guide`.
4. In the description, say what you changed and how you checked it. For example:

   ```text
   What changed:
   - Clarified the local setup steps for new contributors.

   How I tested:
   - Read through the updated instructions.
   ```

5. Click **Create pull request**.

That’s it—you have sent your first pull request! A maintainer may ask a question or request a small change. If that happens, make the update on the same branch, then run `git add`, `git commit`, and `git push` again. The pull request updates automatically.

## If you get stuck

- **`git` or `npm` is not recognized:** Install the tool, close and reopen the terminal, then check its version again.
- **`remote upstream already exists`:** The original repository is already connected. Check it with `git remote -v` and continue.
- **`src refspec ... does not match any`:** Check your branch name with `git branch --show-current`, then use that name in your `git push` command.
- **Git says there are conflicts:** Don’t guess or delete files. Ask for help and include the full error message.
- **The app opens but Firebase features do not work:** The local app server alone does not start Firebase. Follow the emulator instructions in the [README](./README.md#install-and-run-with-local-emulators) only if your contribution needs Firebase behavior.

## After your first pull request

For your next contribution, fetch and merge the latest original `main` **before creating a new work branch**:

```bash
git switch main
git fetch upstream
git merge upstream/main
git push origin main
git switch -c another-small-change
```

If you have already made local changes, finish or save them before switching branches. Do not merge `upstream/main` into a branch that contains unfinished work unless you know you need to update that branch.

Thanks for helping make InstaLite better—and for making it easier for the next beginner to contribute!
