# @packages/electron

This is the lib responsible for installing + building Electron. This enables us to develop with the Electron shell that will match how the final compiled Cypress binary looks 1:1.

It does this by using symlinks while in development.

## Building

```bash
yarn workspace @packages/electron build
```

Note: this just installs Electron binary for your OS specific platform

## Testing

```bash
yarn workspace @packages/electron test
yarn workspace @packages/electron test-debug
yarn workspace @packages/electron test-watch
```

## Upgrading Electron

The version of `electron` that is bundled with Cypress should be kept as up-to-date as possible with the [stable Electron releases](https://www.electronjs.org/releases/stable). Many users expect the bundled Chromium and Node.js to be relatively recent. Also, historically, it has been extremely difficult to upgrade over multiple major versions of Electron at once, because of all the breaking changes in Electron and Node.js that impact Cypress.


Upgrading `electron` involves more than just bumping this package's `package.json`. Here are additional tasks to check off when upgrading Electron:

- [ ] **Write accurate changelog items.** The "User-facing changelog" for an Electron upgrade should mention the new Node.js and Chromium versions bundled.
    - For example:
        - Upgraded `electron` from `12.0.0-beta.14` to `13.1.7`.
        - Upgraded bundled Node.js version from `14.6.0` to `14.17.0`.
        - Upgraded bundled Chromium version from 89.0.0.1234 to 91.0.0.2345.
- [ ] **Determine if the Electron upgrade is a breaking change.** Electron upgrades constitute "breaking changes" in Cypress if:
    - the major version number of Node.js changes, since users rely on the bundled Node.js to load plugins and `.js` fixtures, or
    - there are changes to Electron that require new shared libraries to be installed on Linux, breaking existing CI setups, or
    - there is some other change that would break existing usage of Cypress (for example, a Web API feature being removed/added to the bundled Chromium)
- [ ] **Create and publish Docker `base` and `browsers` family images matching the Node.js and Chromium versions in Electron.** The `browsers` image will be used for CI and the `base` will be used for any new `included` family images.
    - The latest version of Firefox should also be included.
    - See [`cypress-docker-images`](https://github.com/cypress-io/cypress-docker-images/).
- [ ] **Ensure that a matching Node.js version is enforced in the monorepo for local development and CI.** When Electron is upgraded, oftentimes, the bundled Node.js version that comes with Electron is updated as well. Because all unit and integration tests run in normal Node.js (not Electron's Node.js), it's important for this Node.js version to be synced with the monorepo. There are a few places where this needs to be done:
    - [ ] [`/.node-version`](../../.node-version) - used by `nvm` and other Node version managers
    - [ ] [`/package.json`](../../package.json) - update `engines`
    - [ ] [`/scripts/run-docker-local.sh`](../../scripts/run-docker-local.sh) - update Docker image to the new matching `browsers` image
    - [ ] [`/.circleci/config.yml`](../../.circleci/config.yml)
        - Update the Docker `image`s to the new matching `browsers` image.
        - Update the `xcode` version to one with the same major Node.js version bundled. There is usually not an exact match, this is ok as long as the major version number as the same.
    - [ ] Do a global search for the old Node.js version to identify any new areas that may need updating/unification, and update those locations (and this document!)
- [ ] **Manually smoke test `cypress open`.** Upgrading Electron can break the `desktop-gui` in unexpected ways. Since testing in this area is weak, double-check that things like launching `cypress open`, signing into Cypress Cloud, and launching Electron tests still work.
- [ ] **Fix failing tests.** Usually, these are due to breaking changes in either Node.js or Electron. Check the changelogs of both to find relevant changes.
