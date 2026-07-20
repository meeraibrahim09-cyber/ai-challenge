# Summer at TEC — Team Registration

A bilingual (Arabic/English) team registration form with a live dashboard.

## How it works

- `index.html` — the registration form (team name, total members, member names, option, area). Submits a row to a Supabase table via its REST API.
- `dashboard.html` — reads the rows back from Supabase and renders them as a table.
- `config.js` — Supabase project URL, anon (public) key, and table name.
- `i18n.js` — shared translation dictionary and the language toggle (switches text + `dir` between `ltr`/`rtl`).
- `style.css` — shared styling: brand palette and the "Dubai" font (falls back to Noto Sans Arabic / Segoe UI / Tahoma where Dubai isn't installed).
- `assets/qr.png` — QR code linking to the live site.
- Hosted on GitHub Pages, deployed automatically on every push via `.github/workflows/deploy-pages.yml`.

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, open **SQL Editor**, paste the contents of `supabase-setup.sql`, and run it. This creates the `submissions` table and the row-level-security policies the site needs.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon / public** key.
4. Put both into `config.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
5. Push — GitHub Actions deploys the site automatically.

**Security note:** the anon key in `config.js` is meant to be public and safe to ship in client code — it is not a secret like a database password. What it can do is governed entirely by the row-level-security policies in `supabase-setup.sql` (here: insert new submissions and read submissions). The dashboard being publicly readable matches the setup. If you later want to lock down reads, drop the "anon can read" policy and view responses in the Supabase table editor instead.

## Customizing fields

Field labels and choices live in `i18n.js` (both `en` and `ar` sections) and the `<select>`/radio markup in `index.html`. If you add a new column, update `supabase-setup.sql`, the `payload` in `form.js`, and the dashboard columns in `dashboard.html` / `dashboard.js`.
