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

## SEO Notes

- Update `baseUrl` in `config.js`.
- Update `robots.txt` and `sitemap.xml` to your real domain.
- Each page already includes Open Graph and Twitter tags.

## Legal Pages

Rules, Terms of Service, and Privacy content are generated from `config.js` in:

- `legal.rules`
- `legal.tos`
- `legal.privacy`
