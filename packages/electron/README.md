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

- [ ] **Write accurate changelog items.** The "User-facing changelog" for an Electron upgrade should mention the new Node.js and Chromium versions bundled. If this is a patch version of `electron`, a changelog entry might not be needed.
    - For example:
        - Upgraded `electron` from `21.0.0` to `25.8.4`.
        - Upgraded bundled Node.js version from `16.16.0` to `18.15.0`.
        - Upgraded bundled Chromium version from `106.0.5249.51` to `114.0.5735.289`.
- [ ] **Determine if the Electron upgrade is a breaking change.** Electron upgrades constitute "breaking changes" in Cypress if:
    - the major version number of Node.js changes, since users rely on the bundled Node.js to load plugins and `.js` fixtures, or
    - there are changes to Electron that require new shared libraries to be installed on Linux, breaking existing CI setups, or
    - there is some other change that would break existing usage of Cypress (for example, a Web API feature being removed/added to the bundled Chromium)
- [ ] **Create and publish Docker `base-internal` and `browsers-internal` family images matching the Node.js and Chromium versions in Electron.** These images live inside the [`cypress-docker-images`](https://github.com/cypress-io/cypress-docker-images/) repository. The `browsers-internal` image will be used inside our CI pipelines. The `base-internal` image will be used by the `browsers-internal` image and possibly other system images (described below). For general use of Cypress in Docker, we encourage the use of the [Cypress Docker Factory](https://github.com/cypress-io/cypress-docker-images#cypressfactory). This works great for using Cypress as an end user, but doesn't fully suit the needs for developing Cypress, as we require: 
    - The installation of packages, such as `curl`, `xauth`, and `build-essential`/`make` needed for our [`circleci`](../../.circleci/config.yml) jobs/pipelines.
    - Specific images targeted to test Cypress on various node versions and distributions of linux, such as different versions of `ubuntu`.

    These images are currently created on an 'as-needed' basis and are published manually to the [cypress docker repository](https://hub.docker.com/u/cypress). When creating these images, make sure: 
    - The [browsers-internal](https://github.com/cypress-io/cypress-docker-images/tree/master/browsers-internal) image contains the latest version of Firefox and Edge.
    - The Ubuntu images in [base-internal](https://github.com/cypress-io/cypress-docker-images/tree/master/base-internal) are updated to be used in the [system binary tests](../../system-tests/test-binary) if any of the following are true for the images used inside the system binary tests:
      - The last two major [Ubuntu LTS Releases](https://ubuntu.com/about/release-cycle) are out-of-date.
      - The [NodeJS](https://nodejs.org/en) version is not the active LTS.

- [ ] **Ensure that a matching Node.js version is enforced in the monorepo for local development and CI.** When Electron is upgraded, oftentimes, the bundled Node.js version that comes with Electron is updated as well. Because all unit and integration tests run in normal Node.js (not Electron's Node.js), it's important for this Node.js version to be synced with the monorepo. There are a few places where this needs to be done:
    - [ ] [`/.node-version`](../../.node-version) - used by `nvm` and other Node version managers
    - [ ] `@types/node` used throughout the monorepo to determine compatible node types. The major version of this package must reflect the node version set in [`/.node-version`](../../.node-version).
    - [ ] [github workflows](../../.github) - used for repository templates, vulnerability detection, and V8 snapshots. If the node version for Snyk needs to be updated, then the required pull request check into `develop` must also be updated. A repository administrator will need to accomplish this.
    - [ ] [`/package.json`](../../package.json) - update `engines`
    - [ ] [`/scripts/run-docker-local.sh`](../../scripts/run-docker-local.sh) - update Docker image to the new matching `browsers` image
    - [ ] [`/system-tests/test-binary/*`](../../system-tests/test-binary) - update binary system tests to use the newly published Ubuntu and Node images mentioned above, if applicable
    - [ ] [`/.circleci/config.yml`](../../.circleci/config.yml)
        - Update the Docker `image`s to the new matching `browsers` image.
        - Update the `xcode` version to one with the same major Node.js version bundled. There is usually not an exact match, this is ok as long as the major version number as the same.
    - [ ] Do a global search for the old Node.js version to identify any new areas that may need updating/unification, and update those locations (and this document!)
- [ ] **Manually smoke test `cypress open`.** Upgrading Electron can break the `desktop-gui` in unexpected ways. Since testing in this area is weak, double-check that things like launching `cypress open`, signing into Cypress Cloud, and launching Electron tests still work.
- [ ] **Fix failing tests.** Usually, these are due to breaking changes in either Node.js or Electron. Check the changelogs of both to find relevant changes.
- [ ] For **binary publishing**, make sure the `electron` version that we updated in [`/package.json`](../../package.json) matches the `electron` version inside the [publish binary project](https://github.com/cypress-io/cypress-publish-binary/blob/main/package.json). This is to make sure add-on tests inside the publish-binary repository work locally, but are not required to install the correct version of `electron` in CI when publishing the binary.
- [ ] If needed, update the **[V8 Snapshot Cache](https://github.com/cypress-io/cypress/actions/workflows/update_v8_snapshot_cache.yml)** by running the workflow. Make sure to use the branch that contains the electron updates to populate the `'workflow from'` and `'branch to update'` arguments. Select `'Generate from scratch'` and `'commit directly to branch'`. This will usually take 6-8 hours to complete and is best to not be actively developing on the branch when this workflow runs.
