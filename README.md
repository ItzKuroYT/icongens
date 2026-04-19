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

- Choose one delivery option:
   - `TICKETS_WEBHOOK_URL`
   - or `RESEND_API_KEY` + `TICKETS_NOTIFY_TO`
- Optional:
   - `TICKETS_FROM`

Set at least one delivery path in Vercel Environment Variables:

- `TICKETS_WEBHOOK_URL` (recommended for simple delivery)
- or both `RESEND_API_KEY` and `TICKETS_NOTIFY_TO`

Optional:

- `TICKETS_FROM` for custom sender when using Resend

## Auth Persistence (Root Serverless API)

The root auth endpoints are:

- `api/auth/signup.js`
- `api/auth/login.js`

They support two storage modes:

1. MongoDB mode (recommended for Vercel production)
   - Enabled automatically when `MONGODB_URI` is set.
   - Optional `MONGODB_DB` (default: `icongens_support`).
   - Users are stored in the `users` collection.

2. JSON file mode (local/testing fallback)
   - Used when `MONGODB_URI` is not set.
   - Default file path: `data/users-db.json`
   - Optional override: `USERS_DB_PATH`

### Required Vercel Settings For Reliable Signup/Login

Set these in Vercel Project Settings -> Environment Variables:

- `MONGODB_URI` = your MongoDB connection string
- Optional: `MONGODB_DB` = database name (for example `icongens_support`)

Without MongoDB, file storage on serverless is not reliably persistent across instances/redeploys.
