# Minecraft Server Website Template

This template is designed to be easy to edit for any Minecraft server brand.

## Quick Setup

1. Add your assets to the project root:
   - `icon.png` for tab icon and in-page icon.
   - `logo.png` for the main bouncing logo and footer logo.
   - `background.png` (optional) to override the default animated galaxy background.
2. Edit `config.js` to customize:
   - Server name
   - Tab title
   - SEO description and keywords
   - Main server IP and port
   - Hero logo glow color (`hero.logoGlowColor`)
   - Discord / Store / Tracker links
   - Social links (Twitter, Instagram, YouTube, Twitch, Reddit)
   - Live servers for player counts
   - Footer text and legal content
3. Open `index.html` in your browser or host the folder.

## Editable Sections

- Homepage hero: title, subtitle, description
- About text and feature points
- Live player count cards
- Start Your Empire section
- Footer branding and links
- Footer socials (Twitter, Instagram, YouTube, Twitch, Reddit)
- FlowerTracker page header, range buttons, and server list
- FlowerTracker extra stats (Peak Recorded, TPS, Recorded Uptime, Region)
- Rules / TOS / Privacy content

## Background Behavior

- If `background.png` exists, the site automatically uses it with a dark overlay.
- If it does not exist, the animated galaxy background is used.

## Live Player Count

Live data uses:

- `https://api.mcsrvstat.us/3/<server-ip>:<server-port>`
- `https://api.mcstatus.io/v2/status/java/<server-ip>:<server-port>`

Set your server endpoints in `config.js`:

- Global defaults in `server.primaryIp`, `server.primaryPort`, and `server.defaultPort`
- Per-server values in each `servers[]` entry with `ip` and `port`

If no server `port` is set, the template uses `server.defaultPort` (default `25565`).

If a server cannot be reached by the status providers, the UI shows `Error pulling data` in red instead of fake player counts.

If a tracker stat cannot be fetched (for example TPS or region), it shows `Error fetching data` in red for that stat.

### GitHub Pages Fix (Recommended)

GitHub Pages can fail to fetch some Minecraft status providers because of browser-side CORS/provider restrictions.

This template includes a Vercel serverless proxy endpoint:

- `api/player-status.js`

Set this in `config.js`:

- `server.statusProxyUrl`: `https://YOUR-VERCEL-PROJECT.vercel.app/api/player-status`

When set, the frontend will query your Vercel endpoint first and only fall back to public providers if needed.

## SEO Notes

- Update `baseUrl` in `config.js`.
- Update `robots.txt` and `sitemap.xml` to your real domain.
- Each page already includes Open Graph and Twitter tags.

## Legal Pages

Rules, Terms of Service, and Privacy content are generated from `config.js` in:

- `legal.rules`
- `legal.tos`
- `legal.privacy`

## Serverless Tickets (Vercel)

Tickets can be submitted directly from `support/?mode=tickets`.

- Frontend form page: `support/`
- Serverless endpoint: `api/tickets.js`

Deploy this root project to Vercel to enable the endpoint.

If the frontend stays on GitHub Pages, set `links.ticketsApi` in `config.js` to your Vercel function URL (for example `https://your-project.vercel.app/api/tickets`).

### Vercel Setup Values

Deploy this repository root to Vercel if you want both endpoints in one place:

- `api/player-status.js`
- `api/tickets.js`

Set `config.js` values:

- `server.statusProxyUrl`: `https://YOUR-VERCEL-PROJECT.vercel.app/api/player-status`
- `links.ticketsApi`: `https://YOUR-VERCEL-PROJECT.vercel.app/api/tickets` (or `/api/tickets` if site is also on Vercel)

Environment variables for tickets endpoint (`api/tickets.js`):

- Notifications (optional):
   - `TICKETS_WEBHOOK_URL`
   - and/or `RESEND_API_KEY` + `TICKETS_NOTIFY_TO`
   - optional `TICKETS_FROM`

Ticket submissions are now persisted even if notifications fail.

Storage priority for `api/tickets.js`:

1. GitHub-backed JSON mode (recommended for Vercel)
   - Enabled when token/owner/repo are set:
      - `GITHUB_TICKETS_TOKEN` (or fallback `GITHUB_USERS_TOKEN`)
      - `GITHUB_TICKETS_OWNER` (or fallback `GITHUB_USERS_OWNER`)
      - `GITHUB_TICKETS_REPO` (or fallback `GITHUB_USERS_REPO`)
   - Optional:
      - `GITHUB_TICKETS_BRANCH` (fallback `GITHUB_USERS_BRANCH`, default `main`)
      - `GITHUB_TICKETS_PATH` (default `data/tickets-db.json`)
   - Each ticket write commits to your repo file.

2. Local file fallback
   - `data/tickets-db.json`
   - Optional override: `TICKETS_DB_PATH`
   - Runtime filesystem on serverless is not guaranteed durable.

If you only need persistence (no Discord/email notifications), you can skip delivery env vars and rely on storage mode above.

## Auth Persistence (Root Serverless API)

The root auth endpoints are:

- `api/auth/signup.js`
- `api/auth/login.js`

They support three storage modes in this order:

1. GitHub-backed JSON mode (recommended when you want repo file commits + Vercel auto redeploy)
   - Enabled automatically when all are set:
      - `GITHUB_USERS_TOKEN`
      - `GITHUB_USERS_OWNER`
      - `GITHUB_USERS_REPO`
   - Optional:
      - `GITHUB_USERS_BRANCH` (default: `main`)
      - `GITHUB_USERS_PATH` (default: `data/users-db.json`)
      - `GITHUB_API_BASE` (default: `https://api.github.com`)
   - Users are read/written through GitHub Contents API and committed to your repo.

2. MongoDB mode
   - Enabled automatically when `MONGODB_URI` is set and GitHub mode is not configured.
   - Optional `MONGODB_DB` (default: `icongens_support`).
   - Users are stored in the `users` collection.

3. JSON file mode (local/testing fallback)
   - Used when GitHub mode and Mongo mode are both not configured.
   - Default file path: `data/users-db.json`
   - Optional override: `USERS_DB_PATH`

### GitHub-Backed Setup (No Mongo Required)

If you want the same workflow as your other project (JSON file update in repo + auto deploy), configure this in Vercel:

1. Create a GitHub token:
   - Fine-grained token is recommended.
   - Grant repository `Contents` permission with Read and Write.
   - Limit token access to the target repo.

2. In Vercel Project Settings -> Environment Variables, add:
   - `GITHUB_USERS_TOKEN` = your GitHub token
   - `GITHUB_USERS_OWNER` = repo owner/user/org
   - `GITHUB_USERS_REPO` = repo name
   - Optional `GITHUB_USERS_BRANCH` = branch used by Vercel (example `main`)
   - Optional `GITHUB_USERS_PATH` = file path (default `data/users-db.json`)

3. Remove Mongo env vars if you do not want Mongo mode:
   - Remove `MONGODB_URI`
   - Remove `MONGODB_DB`

4. Redeploy.

5. Test flow:
   - Sign up from `support/?mode=signup`
   - Confirm a new commit updates `data/users-db.json`
   - Log in from `support/?mode=login`

Without GitHub mode or Mongo mode, runtime file storage on serverless is not reliably persistent across instances/redeploys.
