Standalone Build and Upload (cPanel-friendly)

Overview
- Build the Next.js app locally in standalone mode and upload the minimal runtime to the server.
- No server-side install/build required (avoids memory limits).

Prereqs (local machine)
- Node.js 18+ (or 20 LTS)
- pnpm installed globally: `npm i -g pnpm`

One-time check
- apps/web/next.config.mjs already sets `output: 'standalone'`.

Build locally
1) Clone and install
   - `git clone <your repo>`
   - `cd plugin-Blaster`
   - `pnpm install`
   - `pnpm --filter @nsm/db prisma generate`
2) Build
   - `pnpm build:standalone`
3) Create a bundle zip (cross-platform)
   - `pnpm bundle:standalone`
   - This creates `web_build.zip` containing the three folders below with paths:
     - `apps/web/.next/standalone/`
     - `apps/web/.next/static/`
     - `apps/web/public/`

Upload to cPanel
1) Upload `web_build.zip` to `/home/<cpanel_user>/repos/plugin-Blaster`
2) Extract so paths exist exactly as:
   - `/home/<cpanel_user>/repos/plugin-Blaster/apps/web/.next/standalone/`
   - `/home/<cpanel_user>/repos/plugin-Blaster/apps/web/.next/static/`
   - `/home/<cpanel_user>/repos/plugin-Blaster/apps/web/public/`
3) cPanel → Node.js App → Startup file:
   - `apps/web/.next/standalone/server.js`
4) Save/Restart app

Environment variables (in cPanel UI)
- `NODE_ENV=production`
- `NEXTAUTH_URL=https://<your-domain>`
- `DATABASE_PROVIDER=mysql`
- `DATABASE_URL=<your mysql url>`
- `NEXTAUTH_SECRET=<32+ chars>`
- `MASTER_ENCRYPTION_KEY=base64:<your_32byte_key>`
- `NEXT_PUBLIC_APP_NAME=WP Update Monitor`
- Optional: SMTP_*, PAYPAL_*, REDIS_URL

Verify
- `GET /healthz` → ok
- `GET /api/healthz` → `{ ok: true }`
- Visit your domain

Future updates
- Rebuild locally: `pnpm install && pnpm --filter @nsm/db prisma generate && pnpm build:standalone`
- Zip again: `pnpm bundle:standalone`
- Upload + extract over the same folders; restart the Node.js App.

