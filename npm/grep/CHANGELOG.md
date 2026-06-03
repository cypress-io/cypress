# [@cypress/grep-v6.0.2](https://github.com/cypress-io/cypress/compare/@cypress/grep-v6.0.1...@cypress/grep-v6.0.2) (2026-06-03)


### Bug Fixes

* improve grep warning message when all specs are filtered ([#33999](https://github.com/cypress-io/cypress/issues/33999)) ([a991400](https://github.com/cypress-io/cypress/commit/a991400a3dcc95e4f12bc2dee701531ecfcd28d6)), closes [#24568](https://github.com/cypress-io/cypress/issues/24568)

# [@cypress/grep-v6.0.1](https://github.com/cypress-io/cypress/compare/@cypress/grep-v6.0.0...@cypress/grep-v6.0.1) (2026-06-01)

# [@cypress/grep-v6.0.0](https://github.com/cypress-io/cypress/compare/@cypress/grep-v5.1.0...@cypress/grep-v6.0.0) (2026-02-05)


### breaking

* **@cypress/grep:** release version 6.0.0 of @cypress/grep ([#33242](https://github.com/cypress-io/cypress/issues/33242)) ([49aa0bb](https://github.com/cypress-io/cypress/commit/49aa0bbab1af77be3f6431d2252c4d7cac6bff26))


### BREAKING CHANGES

* **@cypress/grep:** use Cypress.expose() instead of Cypress.env(), which requires a peer dependency on Cypress 15.10.0

Co-authored-by: Cacie Prins <cacieprins@users.noreply.github.com>

# [@cypress/grep-v5.1.0](https://github.com/cypress-io/cypress/compare/@cypress/grep-v5.0.1...@cypress/grep-v5.1.0) (2026-01-22)


### Features

* add `cy.env()`,` allowCypressEnv`, and deprecate `Cypress.env()` ([#33181](https://github.com/cypress-io/cypress/issues/33181)) ([ebe4a2c](https://github.com/cypress-io/cypress/commit/ebe4a2cab7312df76b28f59c3b0a91fc4a5e2444))

# [@cypress/grep-v5.0.1](https://github.com/cypress-io/cypress/compare/@cypress/grep-v5.0.0...@cypress/grep-v5.0.1) (2025-12-08)


### Bug Fixes

* handle grepFilterSpecs as string "true" from CLI environment variables ([#33060](https://github.com/cypress-io/cypress/issues/33060)) ([d296aad](https://github.com/cypress-io/cypress/commit/d296aad1c9f3598c587ac6e520bd300d9dac1813))

# [@cypress/grep-v5.0.0](https://github.com/cypress-io/cypress/compare/@cypress/grep-v4.1.1...@cypress/grep-v5.0.0) (2025-09-19)


### breaking

* convert @cypress/grep to TypeScript and change what is exported ([c83df82](https://github.com/cypress-io/cypress/commit/c83df82db01ffecc6e217fb1ab01103ef72f1095))


### BREAKING CHANGES

* @cypress/grep now exports a register function that can be imported from the users spec file. Additionally, the plugin can be imported via @cypress/grep/plugin.

# [@cypress/grep-v4.1.1](https://github.com/cypress-io/cypress/compare/@cypress/grep-v4.1.0...@cypress/grep-v4.1.1) (2025-08-08)

# [@cypress/grep-v4.1.0](https://github.com/cypress-io/cypress/compare/@cypress/grep-v4.0.2...@cypress/grep-v4.1.0) (2024-07-02)


### Features

* **deps:** update dependency find-test-names to ^1.28.18 ([#29672](https://github.com/cypress-io/cypress/issues/29672)) ([c3694a8](https://github.com/cypress-io/cypress/commit/c3694a8835f715c9fb3cd1713dbe60f1b047c2ff))

# [@cypress/grep-v4.0.2](https://github.com/cypress-io/cypress/compare/@cypress/grep-v4.0.1...@cypress/grep-v4.0.2) (2024-06-07)


### Bug Fixes

* update cypress to Typescript 5 ([#29568](https://github.com/cypress-io/cypress/issues/29568)) ([f3b6766](https://github.com/cypress-io/cypress/commit/f3b67666a5db0438594339c379cf27e1fd1e4abc))

# [@cypress/grep-v4.0.1](https://github.com/cypress-io/cypress/compare/@cypress/grep-v4.0.0...@cypress/grep-v4.0.1) (2023-10-16)


### Bug Fixes

* **grep:** fix options sent to fast glob package - issue 27216 ([#27231](https://github.com/cypress-io/cypress/issues/27231)) ([5a7eee5](https://github.com/cypress-io/cypress/commit/5a7eee573ec196dc0fcd98768ab021828a3f1307))

# [@cypress/grep-v4.0.0](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.5...@cypress/grep-v4.0.0) (2023-08-29)


* `@cypress/grep-v4.0.0` was inadvertently released and published. There are no breaking changes or any other changes in this release.

# [@cypress/grep-v3.1.5](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.4...@cypress/grep-v3.1.5) (2023-03-15)


### Bug Fixes

* **grep:** references to cypress-grep ([#26108](https://github.com/cypress-io/cypress/issues/26108)) ([7a18b79](https://github.com/cypress-io/cypress/commit/7a18b79efae64dc1fc32fb5aaa89969e83971c6f))

# [@cypress/grep-v3.1.4](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.3...@cypress/grep-v3.1.4) (2023-02-06)

# [@cypress/grep-v3.1.3](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.2...@cypress/grep-v3.1.3) (2022-12-14)


### Bug Fixes

* **grep:** @cypress/grep types ([#24844](https://github.com/cypress-io/cypress/issues/24844)) ([55058e7](https://github.com/cypress-io/cypress/commit/55058e7783420d0946bd19eeb72a08ccf3f3a86e))

# [@cypress/grep-v3.1.2](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.1...@cypress/grep-v3.1.2) (2022-12-09)


### Bug Fixes

* declare used babel dependencies ([#24842](https://github.com/cypress-io/cypress/issues/24842)) ([910f912](https://github.com/cypress-io/cypress/commit/910f912373bf857a196e2a0d1a73606e3ee199be))

# [@cypress/grep-v3.1.1](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.1.0...@cypress/grep-v3.1.1) (2022-12-08)


### Bug Fixes

* fix behavior when only using inverted tags ([#24413](https://github.com/cypress-io/cypress/issues/24413)) ([b2a2e50](https://github.com/cypress-io/cypress/commit/b2a2e508638d5132fc30e01d707de81d22fde359))

# [@cypress/grep-v3.1.0](https://github.com/cypress-io/cypress/compare/@cypress/grep-v3.0.3...@cypress/grep-v3.1.0) (2022-10-21)


### Features

* **grep:** move cypress-grep to @cypress/grep ([#23887](https://github.com/cypress-io/cypress/issues/23887)) ([d422aad](https://github.com/cypress-io/cypress/commit/d422aadfa10e5aaac17ed0e4dd5e18a73d821490))
