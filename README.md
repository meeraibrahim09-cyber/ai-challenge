# Summer at TEC — Team Registration

A bilingual (Arabic/English) team registration form. Submissions are stored in Supabase and reviewed directly in the Supabase table editor.

## How it works

- `index.html` — the registration form (team name, total members, member names, option, areas). Submits a row to a Supabase table via its REST API.
- `config.js` — Supabase project URL, anon (public) key, and table name.
- `i18n.js` — shared translation dictionary and the language toggle (switches text + `dir` between `ltr`/`rtl`).
- `form.js` — form behavior: dynamic member-name rows, the multi-select areas dropdown, validation, and submit.
- `style.css` — shared styling: brand palette and the "Dubai" font (falls back to Noto Sans Arabic / Segoe UI / Tahoma where Dubai isn't installed).
- `assets/qr.png` — QR code linking to the live site.
- Hosted on GitHub Pages, deployed automatically on every push via `.github/workflows/deploy-pages.yml`.

The "Selected areas" field is a multi-select dropdown; the chosen areas are saved into the `area` column as a readable comma-separated list (e.g. `HR, Finance, Governance`).

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, open **SQL Editor**, paste the contents of `supabase-setup.sql`, and run it. This creates the `submissions` table and the row-level-security policies the site needs.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon / public** key.
4. Put both into `config.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
5. Push — GitHub Actions deploys the site automatically.

Review submissions in the Supabase dashboard: **Table Editor → submissions**.

**Security note:** the anon key in `config.js` is meant to be public and safe to ship in client code — it is not a secret like a database password. What it can do is governed entirely by the row-level-security policies in `supabase-setup.sql` (here: insert new submissions). To keep the data private, only the insert policy is needed; remove the "anon can read" policy if you don't want the rows to be publicly readable over the API.

## Customizing fields

Field labels and choices live in `i18n.js` (both `en` and `ar` sections) and the markup in `index.html`. The list of areas is defined by `AREA_KEYS` in `form.js` plus the matching `area_*` labels in `i18n.js`.
