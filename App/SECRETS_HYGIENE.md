# Secrets hygiene (GH013)

- **Build root:** Run `npm run build` and `npm run dev` from **`App/`** (where `package.json` is). Repo root has no `package.json`.
- **Never commit:** `.env`, `.env.local`, `.cursor/.env*`. They are in `.gitignore` and blocked by `.git/hooks/pre-commit`.
- **Template only:** Copy `App/.env.local.example` to `App/.env.local` and fill real values locally. `.env.local.example` contains variable names only (no keys).
- **Push:** After history rewrite, use `git push --force origin main` once. Do not use GitHub "unblock secret" — secrets were removed from history.
