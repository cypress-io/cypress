This workspace (`internal-scripts`) contains the monorepo's build tooling, release automation, and CI utilities. It is not a publishable package; it provides the gulp build pipeline, binary packaging/upload scripts, semantic versioning helpers, and miscellaneous CI scripts used across the repository.

**Key Commands**

- `yarn build` — no-op (no compilation step required)
- `yarn lint` — lint all `.js`, `.ts`, and `.json` files with ESLint
- `yarn gulp <task>` — run a gulp task (tasks are defined in `gulp/gulpfile.ts`); run from the monorepo root, e.g. `yarn dev`
- `node scripts/get-next-version.js` — compute the next semantic version based on conventional commits
- `node scripts/npm-release.js` — orchestrate an npm package release
- `node scripts/prepare-release-artifacts.js` — prepare binary artifacts for a release
- `node scripts/binary.js` — entry point for binary build/upload/smoke-test operations

**Architecture**

- `gulp/` — Gulp build pipeline: `gulpfile.ts` defines all tasks; `tasks/` contains individual task modules (Vite builds, webpack, GraphQL codegen, autobarrel, package assembly, cloud validation sync, etc.); `utils/` has shared helpers (child process, exit, path map, stream prefix)
- `binary/` — Cypress binary lifecycle: `build.ts` (electron-builder packaging), `upload.js` / `upload-build-artifact.js` (S3 upload), `move-binaries.ts` (post-release artifact moves), `smoke.js` (smoke-test the built binary), `zip.js` (zip/unzip), `util/` (packages manifest, upload helpers, CloudFlare cache purge)
- `semantic-commits/` — Conventional commit helpers: `get-current-release-data.js`, `get-linked-issues.js`, `validate-binary-changelog.js`
- `github-actions/semantic-pull-request/` — GitHub Action that validates PR titles against the conventional commit format
- `unit/` — Mocha unit tests for the scripts themselves (mirrors the top-level directory structure)
- Top-level loose scripts — one-off utilities: `circle-env.js`, `circle-cache.js`, `sanitize-mocha-results.js`, `verify-mocha-results.js`, `verify-accessibility-results.js`, `format-workflow-file.js`, `windows-sign.js`, `after-sign-hook.js`, `after-pack-hook.js`, `sync-exported-npm-with-cli.js`, etc.

**Gotchas / Notes**

- The gulp tasks in `gulp/gulpfile.ts` are the canonical way to drive local development; most developers run `yarn dev` from the monorepo root rather than invoking scripts here directly.
- `binary/build.ts` calls into `../../packages/electron` and depends on `electron-builder`; it must be run with the full monorepo installed and the `@packages/electron` package present.
- Scripts that interact with S3 or CloudFlare require the appropriate environment variables (`AWS_*`, `CF_*`) to be set; they are intended for CI use, not local runs.
- `github-actions/semantic-pull-request/` has its own `package.json` and is deployed as a standalone GitHub Action — do not modify it without understanding the action's deployment model.
