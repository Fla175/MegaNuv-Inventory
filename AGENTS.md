# AGENTS.md — MegaNuv Inventory

## Initial OpenCode + Obsidian Integration

- This repo is designed for OpenCode agents. Each session should begin by reading `AGENTS.md`, then `CONTEXT.md` (for current focus) and `SPECS.md` (for specs and DoD).
- For note-taking and context retention across sessions, use [Obsidian](https://obsidian.md) with a vault linked to this project. Store session summaries, ADR decisions, and open questions as markdown notes; link them from `CONTEXT.md` §2.1 so future agents can resume where the previous one left off.
- Before first push or version bump, verify that `MINIO_ENDPOINT`, `JWT_SECRET`, and `DATABASE_URL` are set in `.env` — the app **crashes at startup** if any are missing (`lib/auth.ts:8`, `lib/minio.ts`).

## Commit Only When Explicitly Permitted

- The agent **must not** auto-commit or push. Wait for explicit user approval (`"proceed with commit"`) before running any `git` command that modifies history.
- When permitted, follow the atomic commit workflow below. If the user declines, discard the changes and report the outcome.

## Branch & Versioning Workflow

- **Create a new branch** for every update: `<tipo>/<descurivo>` (e.g., `fix/minio-key`, `feat/active-filters`). Never work directly on `main` or versioned branches.
- **Version bumps** use `npm version <X.Y.Z>`. The agent must NOT create tags or commits automatically without explicit permission of the user. `lib/version.ts` reads the version from `package.json` — no hardcode.
- After the bump, the agent must report the new version and ask for permission to create a dedicated branch (e.g., `inventory-vX.Y.Z`), push, open a PR, and merge to `main`.
- A bump example if the project is at `2.4.11` version:
  ```bash
  npm version 2.5.1
  # → package.json updated from 2.4.11 to 2.5.1
  # → DO NOT commit or tag without explicit requirement or permission of the user;
  ```

## Atomic Commits — Conventional Commits

- Every atomic commit must follow **Conventional Commits** format:
  ```
  <type>(<escopo>): <descrição>
  ```
- Types and version impact:
  - `feat` — new feature → **minor** version bump (ex: `feat(active): add weight field`)
  - `fix` — bug correction → **patch** version bump (ex: `fix(minio): correct key derivation from URL`)
  - `docs` — documentation only → no version bump
  - `style`, `refactor`, `test` — internal changes → no version bump
  - `chore` — tooling/script changes → no version bump (or minor, per team call)
- The agent must produce the **title** (the `<descrição>` part) and the user confirms the version level.
- Example atomic commit sequence for a feature:
  1. `git checkout -b feat/active-weight`
  2. Make changes, write tests
  3. `git add -p` / selective staging for each logical change
  4. `git commit -m "feat(active): add weight field to inventory items"`
  5. `git push origin feat/active-weight`
  6. Open PR, await review, merge to `main` (human)

## Pull Request, Merge & Release with `gh`

- After atomic commits on a feature branch, open a PR via GitHub CLI or the web UI.
- The PR must pass all quality gates: `yarn lint` (0 errors), `npx tsc --noEmit` (0 errors), `npx prisma validate` (OK), `yarn build:opt` (standalone build), `yarn test` (Vitest suite).
- **Merge** to `main` is done via a squash or merge commit as the team decides — the agent does not merge.
- **Tag and release** It needs to create an annotated tag `vX.Y.Z` and a GitHub Release via `gh release create vX.Y.Z --notes "..."`. The agent will do this actions during the execution of commits in explicit user's requirement.
