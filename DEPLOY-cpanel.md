Deploying to cPanel (lowenet.biz)

Overview
- Use cPanel Git Version Control to pull from GitHub.
- Use cPanel Node.js app (Passenger) to run `server.js` at repo root.
- Build the Next.js app in `apps/web` and start via the custom server.
- Apply Prisma schema with `migrate deploy` (preferred) or `db push` fallback.

One-time setup
1) Domain
   - Use your main domain `lowenet.biz` (or create a subdomain if you prefer).

2) Git Version Control
   - cPanel → Git Version Control → Create
   - Repository URL: your GitHub repo
   - Repository path (example): `/home/fuzehhdo/repos/plugin-Blaster`
     (Your note showed `/home/fuzehhdo/~/repos/plugin-Blaster`, but the correct path omits the extra `~/`.)

3) Node.js App
   - cPanel → Setup Node.js App
   - Node version: 18+
   - Application root: the same repo path (e.g., `/home/fuzehhdo/repos/plugin-Blaster`)
   - Application URL: select `lowenet.biz` (or your chosen subdomain)
   - Startup file: `server.js`

4) Env vars (Node.js App → Environment Variables)
   - `NODE_ENV=production`
   - `DATABASE_URL=mysql://fuzehhdo_lowenet_wpmon_u:3InMzA%24ovzrj@127.0.0.1:3306/fuzehhdo_lowenet_wpmon`
   - `NEXTAUTH_URL=https://lowenet.biz`
   - `NEXTAUTH_SECRET=...` (32+ chars)
   - `MASTER_ENCRYPTION_KEY=...`
   - `REDIS_URL=...` (if using queues)
   - Email/PayPal variables as needed
   - Save and Restart app

5) First deploy (manual pull)
   - Git Version Control → Manage → Pull
   - Terminal (or Deployment script) steps:
     - Enable corepack: `corepack enable` (optional)
     - Install dependencies: `pnpm i --frozen-lockfile` (or `npm ci`)
     - Prisma generate: `pnpm --filter @nsm/db prisma generate`
     - Apply schema: `pnpm db:migrate` (or `pnpm --filter @nsm/db prisma db push --accept-data-loss` if deploy is blocked)
     - Build: `pnpm -r build`
     - Restart Passenger: `mkdir -p tmp && touch tmp/restart.txt`

Ongoing deploys (fast)
- On each Pull in cPanel Git UI, re-run the steps above.
- Or create a `hooks/post-receive` script that runs the commands. Mark it executable.

Health check
- HTTP: `GET /healthz` (served by server.js)
- Next API: `GET /api/healthz` (returns `{ ok: true }`)

Notes
- Prisma `migrate dev` needs a shadow DB; prefer `migrate deploy` on cPanel.
- If `migrate deploy` is blocked, use `db push` as fallback (be cautious with existing data).
- Passenger logs: check cPanel Node.js app logs / domain error logs for runtime issues.
