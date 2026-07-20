# Summer at TEC — Team Registration

A bilingual (Arabic/English) team registration form with a live dashboard.

## How it works

- `index.html` — the registration form (team name, total members, option, area). Submits by creating a GitHub Issue via the GitHub REST API.
- `dashboard.html` — reads submissions back from the repo's public Issues API (no login needed to view) and renders them as a table.
- `i18n.js` — shared translation dictionary and the language toggle (switches text + `dir` between `ltr`/`rtl`).
- `style.css` — shared styling: brand palette and the "Dubai" font (falls back to Noto Sans Arabic / Segoe UI / Tahoma where Dubai isn't installed).
- Hosted on GitHub Pages, deployed automatically on every push via `.github/workflows/deploy-pages.yml`.

## Setup

1. Create a GitHub fine-grained personal access token scoped to **this repo only**, with **Issues: Read and write** permission (and nothing else): `github.com/settings/personal-access-tokens/new`.
2. Set `GITHUB_TOKEN` in `form.js` to that token.
3. Push — GitHub Actions deploys the site automatically.

Submissions are tagged with the `submission` label so the dashboard's query (`issues?labels=submission`) only pulls registrations, not other repo issues.

**Security note:** the token in `form.js` is public (visible to anyone viewing the page source), by necessity — a static site has no server to hide it behind. It is scoped to only create issues in this one repo, so the worst case of misuse is spam issues here, which can be deleted, with the token revoked and replaced anytime from GitHub settings.

## Customizing fields

Field labels and choices live in `i18n.js` (both `en` and `ar` sections) and the `<select>`/radio markup in `index.html`.
