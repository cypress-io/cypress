---
paths:
  - "packages/errors/src/errors.ts"
  - "packages/data-context/schemas/*.graphql"
  - "packages/data-context/src/gen/**"
  - "packages/cypress-sessions/lib/generated/**"
  - "packages/*/src/generated/**"
  - "scripts/gulp/monorepoPaths.ts"
  - ".circleci/src/**"
  - ".circleci/packed/**"
---

# Generated files — regenerate, never hand-edit

- `packages/data-context/schemas/schema.graphql`, `src/gen/nxs.gen.ts` —
  `yarn workspace @packages/data-context build`
- `src/generated/graphql.ts` in `app` / `launchpad` / `frontend-shared`, and
  `packages/cypress-sessions/lib/generated/graphql.ts` —
  `yarn workspace @packages/data-context build:graphql` (watch: `yarn codegen`)
- autobarrel `index.ts` files (header `created by autobarrel`) — regenerated on save by
  the `yarn codegen` watcher; there is no one-shot task
- `scripts/gulp/monorepoPaths.ts` — `yarn gulp makePathMap`, after adding or removing a package
- `.circleci/packed/*.yml` — `yarn pack-ci --validate`; edit `.circleci/src/` only

## What actually needs committing

Most codegen output is gitignored, so only two generated artifacts belong in a PR:
`packages/data-context/schemas/schema.graphql` and
`packages/cypress-sessions/lib/generated/graphql.ts`.

Adding or removing a key in `packages/errors/src/errors.ts` changes `ErrorTypeEnum`
via `Object.keys(AllCypressErrors)` — regenerate and commit `schema.graphql` in the
**same** PR, or type-checking breaks for everyone downstream.

`.circleci/packed/` does not exist in a fresh checkout and requires the CircleCI CLI;
`scripts/pack-ci.sh` exits early without it. See [`.circleci/AGENTS.md`](../../.circleci/AGENTS.md).

Note: `packages/scaffold-config/src/index.ts` carries the autobarrel header but its
path is not in `autobarrel.json`, so `yarn codegen` will not regenerate it.
