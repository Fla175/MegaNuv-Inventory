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
- **Version bumps** use `npm version <X.Y.Z> --no-git-tag-version` — the `--no-git-tag-version` flag is **mandatory**. The agent must NOT create tags or commits automatically; only bump `package.json`'s version field. `lib/version.ts` reads the version from `package.json` — no hardcode.
- After the bump, the agent must report the new version and request the user to create a dedicated branch (e.g., `inventory-vX.Y.Z`), push, open a PR, and merge to `main` — these are human actions.
- The version currently is `2.27.8` (in `package.json:3`). A bump example:
  ```bash
  npm version 2.28.0 --no-git-tag-version
  # → package.json updated from 2.27.8 to 2.28.0
  # → DO NOT commit or tag; report new version to user
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
- **Tag and release** are human actions: the user (or release owner) creates an annotated tag `vX.Y.Z` and a GitHub Release via `gh release create vX.Y.Z --notes "..."`. The agent may assist by reporting the new version and changed files but must not create the tag or release autonomously.

## What This Session Did (Medium Paragraph)

> Este agente leu o estado atual do repositóriO (branch `fix/revert-classification`, version `2.27.8`, CONTEXT.md com foco em correções de segurança P0 e pendências de system-versioning), gerou o presente `AGENTS.md` com políticas de commit sob permissão do usuário, fluxo de branch dedicado, versionamento via `npm version --no-git-tag-version`, commits convencionais (Conventional Commits) com tipos `feat`/`fix` e impactos de minor/patch, e workflow de PR/merge/release manual com `gh`. O agente não realizou commits, pushes, tags ou releases automaticamente — todas as ações de versionamento e merge dependem de aprovação e execução humana. O próximo passo é que o usuário revise o fluxo, solicite o bump de versão ou abra PR a partir de uma branch própria.