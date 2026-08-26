# Summer at TEC — AI Challenge

A bilingual (Arabic/English) static site for the Summer at TEC AI Challenge, hosted on
GitHub Pages with Supabase as the backend. It has three pages:

| Page | Purpose |
| --- | --- |
| `index.html` | **Registration form** — team name, member count, member names, options, and areas of interest. |
| `survey.html` | **Session feedback survey** — a rating scale plus multiple-choice and free-text questions. |
| `dashboard.html` | **Organiser dashboard** — signs in with Supabase Auth and lists registered teams with summary stats. |

Every page shares the same header, brand styling, and English/Arabic toggle (which also
flips the document between `ltr` and `rtl`).

## Files

- `config.js` — Supabase project URL, anon (public) key, and the submissions table name.
- `i18n.js` — the full EN/AR translation dictionary and the language toggle. All user-facing
  text lives here, keyed by the `data-i18n` attributes in the HTML.
- `form.js` — registration behaviour: dynamic member-name rows (max 5), the 17-option areas
  multi-select, validation, and submit.
- `survey.js` — survey behaviour: rating buttons, required checkbox groups, and submit.
- `dashboard.js` — email/password sign-in against Supabase Auth, token refresh in
  `localStorage`, fetching submissions, stat cards, and the responsive table.
- `style.css` — shared styling: brand palette, the "Dubai" font (falling back to
  Noto Sans Arabic / Segoe UI / Tahoma), and RTL rules.
- `supabase-setup.sql` — table definitions and row-level-security policies.
- `assets/logo.png`, `assets/qr.png` — brand logo and a QR code linking to the live site.
- `.github/workflows/deploy-pages.yml` — deploys to GitHub Pages on every push.

There is no build step and no dependencies: the pages load `config.js`, `i18n.js`, and their
own script with plain `<script>` tags.

## Data model

Two tables, both written directly from the browser via the Supabase REST API.

**`submissions`** (registration form)

| Column | Notes |
| --- | --- |
| `team_name` | text, max 150 characters |
| `total_members` | integer, 1–5 |
| `members` | `jsonb` array of member names |
| `option` | selected options as a comma-separated list |
| `area` | selected areas as a readable comma-separated list, e.g. `HR, Finance, Governance` |

**`survey_responses`** (feedback survey)

| Column | Notes |
| --- | --- |
| `rating` | integer, 1–5 |
| `enjoyed`, `ideas`, `expand` | comma-separated lists of the checked choices |
| `improve` | free text, max 150 characters |

The multi-select answers are flattened to comma-separated strings so the rows stay readable
in the Supabase table editor.

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase-setup.sql`, and run it. This creates
   both tables and their row-level-security policies.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon / public** key.
4. Put both into `config.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
5. Create a dashboard user under **Authentication → Users** — that email and password are
   what the dashboard sign-in expects.
6. Push. GitHub Actions deploys the site automatically.

Submissions can also be reviewed directly in the Supabase dashboard under
**Table Editor → submissions** / **survey_responses**.

### Known gap

`dashboard.js` filters out flagged rows with `hidden=eq.false`, but `supabase-setup.sql`
does not create a `hidden` column. On a fresh project the dashboard query fails until the
column is added:

```sql
alter table public.submissions
  add column if not exists hidden boolean not null default false;
```

Set `hidden = true` on a row to keep it out of the dashboard.

## Access model

The anon key in `config.js` is designed to be embedded in client-side code — it is not a
secret like a database password. What it can do is governed entirely by the row-level-security
policies in `supabase-setup.sql`:

- `submissions` — anyone may **insert** (the public form) and anyone may **read**.
- `survey_responses` — anyone may **insert** (the public survey); only **authenticated** users
  may read.

Note the consequence: the dashboard sign-in is a gate on the *page*, not on the registration
data. Because `submissions` still carries an "anon can read" policy, those rows are readable
by anyone with the anon key. Drop that policy and replace it with an `authenticated`-only
select policy (mirroring the one on `survey_responses`) if registrations should be private.

## Customizing

- **Labels and choices** — edit the `en` and `ar` sections of `i18n.js`; the markup references
  them through `data-i18n` attributes.
- **Areas list** — `AREA_KEYS` in `form.js`, plus matching `area_*` keys in `i18n.js`.
- **Limits** — `MAX_LEN` (150 characters) in `form.js` and `survey.js`; the 5-member cap in
  `form.js`.
- **Survey questions** — the markup in `survey.html`, the `REQUIRED_GROUPS` array in
  `survey.js`, and the `survey_*` keys in `i18n.js`.
