This workspace (`@tooling/system-tests`) contains Cypress's suite of system (integration) tests. Each test launches the real Cypress server process against a self-contained project fixture and asserts on stdout, exit codes, and snapshots — making them as close to real-world runs as possible. Tests run in CI across Electron, Chrome, Firefox, and WebKit.

**Key Commands**

- `node ./scripts/run.js --glob-in-dir="<pattern>"` — preferred for local runs; runs a subset of specs by name pattern (e.g. `screenshot` matches all screenshot specs)
- `yarn test` — runs the full system test suite; very slow and intended for CI only — prefer `--glob-in-dir` locally
- `yarn test:ci` — CI-only variant (no glob-in-dir filter); do not run locally
- `yarn build` — scaffold fixture dirs via `scripts/scaffold.js`
- `yarn projects:yarn:install` — install `node_modules` for all test projects that have a `package.json`
- `yarn update:snapshots` / `SNAPSHOT_UPDATE=1 yarn test <path-to-spec>` — regenerate stdout snapshots

**Architecture**

- `test/` — Mocha specs (`.spec.ts`/`.spec.js`) run against the unbuilt Cypress app; these are the primary system test files
- `test-binary/` — Mocha specs run against the *built* Cypress binary inside Docker containers; used to test node versions, CI environments, and module API behavior
- `lib/` — Test harness library: `system-tests.ts` (the main `systemTests.it`/`systemTests.setup` wrapper), `fixtures.ts` (project scaffolding), `normalizeStdout.ts` (stdout scrubbing for snapshots), `dep-installer/` (yarn/npm install logic), `protocol-stubs/` (cloud protocol stubs), `docker.ts`
- `projects/` — Self-contained Cypress project fixtures, one directory per project; each is copied to a temp dir before the test runs
- `project-fixtures/` — Reusable fixture fragments (React, Angular, runner-specs) copied into projects at scaffold time via `projectFixtureDirectory` in the project's `package.json`
- `scripts/` — Internal runner helpers: `run.js` (test runner entry), `scaffold.js` (build step), `projects-yarn-install.js`, `bootstrap-docker-container.sh`

**Gotchas / Notes**

- Test projects are copied to a temp directory *outside* the monorepo before each run, so they do not inherit monorepo `node_modules`. Dependencies needed inside a project must be declared in that project's own `package.json`.
- A small set of common packages (`lodash`, `debug`, etc.) is scaffolded automatically for all projects via `scaffoldCommonNodeModules` in `lib/fixtures.ts` — these do not need to be listed in project `package.json` files.
- To keep the browser open after a run for debugging: pass `--no-exit` to the test command (e.g. `node ./scripts/run.js --glob-in-dir="go_spec" -- --browser chrome --no-exit`).
- `test-binary/` specs require a built Cypress `.zip` and a running Docker daemon; they should not be run locally without the full build artifact.
- Snapshot mismatches on Retina displays can occur when updating screenshots; set `SNAPSHOT_BROWSER=chrome` when running `SNAPSHOT_UPDATE=1` on a Retina machine.
- `UPDATE_LOCK_FILE=1` allows `yarn.lock`/`package-lock.json` inside a project fixture to be updated and synced back from the temp dir.
- The `pretest` / `pretest:ci` hooks run `yarn gulp ensureCloudValidations` — this must pass before tests execute.
