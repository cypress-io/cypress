# @cypress/eslint-plugin-dev

`@cypress/eslint-plugin-dev` is a published npm package providing shared ESLint rules and configurations used internally across Cypress development packages. It is intended exclusively for use within the Cypress monorepo and its internal tooling — it is not the user-facing Cypress ESLint plugin (which lives in a separate `eslint-plugin-cypress` repository).

## Key Commands

```sh
yarn lint           # ESLint on this package itself
yarn lint-changed   # lint only files changed since the last commit
yarn lint-fix       # ESLint with --fix
yarn test -- <path-to-spec>                     # run a specific vitest spec file
yarn test -- "<glob-pattern>"                   # run vitest specs matching a glob
```

## Architecture

- `lib/index.js` — main entry point; exports the ESLint plugin (rules and configs)
- `lib/custom-rules/` — custom ESLint rules authored for Cypress internals
- `lib/scripts/` — CLI scripts:
  - `lint-changed.js` (also exposed as `lint-changed` binary) — lints only changed files
  - `lint-pre-commit.js` (also exposed as `lint-pre-commit` binary) — pre-commit hook linting

## Gotchas / Notes

- This is an internal development tool only. Do not recommend it to Cypress end users; they should use `eslint-plugin-cypress` instead.
- The package exposes two CLI binaries (`lint-changed` and `lint-pre-commit`) which are used in git hooks and CI tooling across the monorepo.
- Peer dependencies cover ESLint 8.x only (`eslint: "^= 8.0.0"`); not compatible with ESLint 9 flat config in its consumer role.
