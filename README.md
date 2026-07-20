# Team Check-in Form

A minimal sign-up form collecting Name, Team Name, and an Option choice.

## How it works

- `index.html` / `style.css` / `script.js` — the form, submitted via [Formspree](https://formspree.io).
- Hosted on GitHub Pages, deployed automatically on every push to `main` via `.github/workflows/deploy-pages.yml`.
- Submissions and a live dashboard of responses are viewable in your Formspree account.

## Setup

1. Create a form at [formspree.io](https://formspree.io) and copy its endpoint (`https://formspree.io/f/xxxxxxxx`).
2. Set `FORMSPREE_ENDPOINT` in `script.js` to that endpoint.
3. Push to `main` — GitHub Actions deploys the site to GitHub Pages automatically.

## Customizing fields

The three fields (name, team, option) live in `index.html`. The `option` dropdown's choices are in the `<select id="option">` block — edit the `<option>` values there to change the choices.
