This package copies e2e spec files and app content from the external `cypress-example-kitchensink` npm package into the Cypress repository, where the specs are used to scaffold new user projects and the app is published to `https://example.cypress.io`.

**Key Commands**

```bash
# Copy kitchensink specs and app into this package
yarn workspace @packages/example build

# Deploy app content to GitHub Pages (production!)
yarn workspace @packages/example deploy
```

**Architecture**

- `cypress/` — Example e2e spec files copied from `cypress-example-kitchensink` (do not edit here)
- `lib/` — Supporting JS for the build/copy process
- `gulpfile.js` — Gulp tasks that drive the copy and asset-revision steps
- `cypress.config.js` — Cypress config for running the example specs

**Gotchas / Notes**

- Do not edit any files in `cypress/` or `app/` directly. All changes must be made in the upstream [`cypress-example-kitchensink`](https://github.com/cypress-io/cypress-example-kitchensink) repository and then pulled in by bumping the `devDependency` version and re-running `build`.
- Running `deploy` publishes directly to the GitHub Pages production site; verify the `./build` directory first.
- The `cypress/` and `app/` directories are outputs of the build step and must be committed after a kitchensink version bump.
- To update the example content: bump `cypress-example-kitchensink` in `package.json`, run `yarn` and `yarn workspace @packages/example build`, then open a PR.

**Auto-Generated Files**

- `cypress/` and `app/` — Copied from `cypress-example-kitchensink` by the `build` script; do not edit by hand.
