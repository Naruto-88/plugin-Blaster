# Automated cPanel Deployment (The "GitHub Actions" Way)

This guide explains how to set up **Automated Updates**. Every time you `git push`, your site will be updated automatically.

## Step 1: Prepare the Node.js App in cPanel
1. Log in to cPanel -> **"Setup Node.js App"**.
2. Click **"Create Application"**.
3. Set the following:
   - **Node.js version**: 20.x (preferred)
   - **Application mode**: Production
   - **Application root**: `plugin-blaster` (or your folder name)
   - **Application URL**: Your domain.
   - **Application startup file**: `server.js`
4. Click **"Create"**.

## Step 2: Configure GitHub Secrets
To allow GitHub to talk to your cPanel, you need to add "Secrets":
1. Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **"New repository secret"** for each of these:
   - `FTP_SERVER`: Your server domain or IP (e.g., `ftp.yourdomain.com`).
   - `FTP_USERNAME`: Your cPanel username.
   - `FTP_PASSWORD`: Your cPanel password.
   - `REMOTE_FOLDER`: The folder name where you put the app (e.g., `plugin-blaster`).

## Step 3: Deployment Logic
I have already created the `.github/workflows/deploy.yml` file in your repo. From now on:
1. You work on your code locally.
2. You run `git push origin main`.
3. GitHub will start a "Building" process (check the **Actions** tab in GitHub).
4. Once it's done, the files are automatically uploaded to your cPanel.

## Step 4: First Time Setup (One-time)
Because cPanel hosting is limited, you might need to run a few commands **only once** in the cPanel **Terminal**:
1. Open cPanel -> **Terminal**.
2. Type: `cd your-app-folder`
3. Install dependencies: `npm install` (or `pnpm i` if pnpm is installed).
4. Run Prisma setup: `npx prisma db push` (to create your database tables).

## How to give "New Updates"?
Just finish your work locally and **Push to GitHub**. The "Actions" system handles everything else.

> [!TIP]
> If your changes don't show up immediately, go to **Setup Node.js App** in cPanel and click the **"Restart"** button.
