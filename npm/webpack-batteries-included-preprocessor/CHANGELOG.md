# [@cypress/webpack-batteries-included-preprocessor-v4.1.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v4.0.4...@cypress/webpack-batteries-included-preprocessor-v4.1.0) (2026-04-13)


### Features

* TypeScript 6 compatibility for webpack preprocessor and CT wizard ([#33575](https://github.com/cypress-io/cypress/issues/33575)) ([8eaedab](https://github.com/cypress-io/cypress/commit/8eaedab0d8679a0ae595dc7711b1be2cc784f707))

# [@cypress/webpack-batteries-included-preprocessor-v4.0.4](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v4.0.3...@cypress/webpack-batteries-included-preprocessor-v4.0.4) (2025-11-13)

# [@cypress/webpack-batteries-included-preprocessor-v4.0.3](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v4.0.2...@cypress/webpack-batteries-included-preprocessor-v4.0.3) (2025-11-07)

# [@cypress/webpack-batteries-included-preprocessor-v4.0.2](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v4.0.1...@cypress/webpack-batteries-included-preprocessor-v4.0.2) (2025-08-27)


### Bug Fixes

* correctly discover TypeScript compiler in `@cypress/webpack-batteries-included-preprocessor` ([#32339](https://github.com/cypress-io/cypress/issues/32339)) ([05c1828](https://github.com/cypress-io/cypress/commit/05c1828b2e81eabd61644e6e05ef8c59ccfe7717))

# [@cypress/webpack-batteries-included-preprocessor-v4.0.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v4.0.0...@cypress/webpack-batteries-included-preprocessor-v4.0.1) (2025-08-19)


### Bug Fixes

* ts-loader detection (false positive) ([#32266](https://github.com/cypress-io/cypress/issues/32266)) ([f7c9847](https://github.com/cypress-io/cypress/commit/f7c98473f53ecfd944a1aace10ea888a62a01e8f))

# [@cypress/webpack-batteries-included-preprocessor-v4.0.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.1.2...@cypress/webpack-batteries-included-preprocessor-v4.0.0) (2025-08-08)


### breaking

* release version 4.0.0 of @cypress/webpack-batteries-included-preprocessor. ([a08bb7b](https://github.com/cypress-io/cypress/commit/a08bb7b33c2cfc6e4a1304ed17c110f35823387e))


### Features

* allow for @cypress/webpack-batteries-included-preprocessor to fully resolve the user tsconfig compiler options ([#31590](https://github.com/cypress-io/cypress/issues/31590)) ([f369f50](https://github.com/cypress-io/cypress/commit/f369f50045685648b94d05ab6426099ee80d1245))


### BREAKING CHANGES

* release a major version of @cypress/webpack-batteries-included-preprocessor as webpack 4 is no longer supported and built-ins are removed

# [@cypress/webpack-batteries-included-preprocessor-v3.1.2](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.1.1...@cypress/webpack-batteries-included-preprocessor-v3.1.2) (2025-07-24)


### Bug Fixes

* Add extensionAlias for ESM TS to webpack-batteries-included ([#31994](https://github.com/cypress-io/cypress/issues/31994)) ([cabdae7](https://github.com/cypress-io/cypress/commit/cabdae708d43464f4f7e86e6f400823dcc95abe6)), closes [#26827](https://github.com/cypress-io/cypress/issues/26827) [#28805](https://github.com/cypress-io/cypress/issues/28805)

# [@cypress/webpack-batteries-included-preprocessor-v3.1.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.1.0...@cypress/webpack-batteries-included-preprocessor-v3.1.1) (2025-07-01)

# [@cypress/webpack-batteries-included-preprocessor-v3.1.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.0.7...@cypress/webpack-batteries-included-preprocessor-v3.1.0) (2025-05-13)


### Features

* ship webpack-bundle-analyzer with`@cypress/webpack-dev-server` and `@cypress/webpack-batteries-included-preprocessor` ([#31588](https://github.com/cypress-io/cypress/issues/31588)) ([46f2867](https://github.com/cypress-io/cypress/commit/46f2867b9dafbf991bf7154cb181eb07d9c6ad20))

# [@cypress/webpack-batteries-included-preprocessor-v3.0.7](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.0.6...@cypress/webpack-batteries-included-preprocessor-v3.0.7) (2025-03-26)


### Bug Fixes

* allow version 10 of the babel-loader peer dependency ([#31218](https://github.com/cypress-io/cypress/issues/31218)) ([33cf18e](https://github.com/cypress-io/cypress/commit/33cf18e409a25573566b033f50b03d824e32cef1))

# [@cypress/webpack-batteries-included-preprocessor-v3.0.6](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.0.5...@cypress/webpack-batteries-included-preprocessor-v3.0.6) (2025-03-25)


### Bug Fixes

* change default options for sourceMaps inside WBIP ([#31270](https://github.com/cypress-io/cypress/issues/31270)) ([7bdf1e9](https://github.com/cypress-io/cypress/commit/7bdf1e98707329157c7149b5b26fcb5bf799b8bc))

# [@cypress/webpack-batteries-included-preprocessor-v3.0.5](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.0.4...@cypress/webpack-batteries-included-preprocessor-v3.0.5) (2024-08-14)


### Bug Fixes

* Upgrade elliptic to address security vulnerability ([#30037](https://github.com/cypress-io/cypress/issues/30037)) ([07bc653](https://github.com/cypress-io/cypress/commit/07bc6534d7e0af90f66cf87b25754936afea4b8b))

# [@cypress/webpack-batteries-included-preprocessor-v3.0.4](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.0.3...@cypress/webpack-batteries-included-preprocessor-v3.0.4) (2024-07-30)


### Bug Fixes

* allow yarn 4 berry to work with cypress webpack preprocessor ([#29901](https://github.com/cypress-io/cypress/issues/29901)) ([1521399](https://github.com/cypress-io/cypress/commit/1521399bc8375da30370d33ec17317975bb6b63a))

# [@cypress/webpack-batteries-included-preprocessor-v3.0.3](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.0.2...@cypress/webpack-batteries-included-preprocessor-v3.0.3) (2024-06-07)


### Bug Fixes

* update cypress to Typescript 5 ([#29568](https://github.com/cypress-io/cypress/issues/29568)) ([f3b6766](https://github.com/cypress-io/cypress/commit/f3b67666a5db0438594339c379cf27e1fd1e4abc))

# [@cypress/webpack-batteries-included-preprocessor-v3.0.2](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.0.1...@cypress/webpack-batteries-included-preprocessor-v3.0.2) (2023-08-31)


### Bug Fixes

* change how tsconfig is aliased in webpack-batteries-included-preprocessor ([#27706](https://github.com/cypress-io/cypress/issues/27706)) ([6081751](https://github.com/cypress-io/cypress/commit/6081751c411a45bb9eaf7ba200d4921acdcc2422))

# [@cypress/webpack-batteries-included-preprocessor-v3.0.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v3.0.0...@cypress/webpack-batteries-included-preprocessor-v3.0.1) (2023-08-29)


### Bug Fixes

* resolve process/browser to process/browser.js to resolve correctly in ESM packages where .mjs or .js files exist where process is being used and globally imported. [run ci] ([#27611](https://github.com/cypress-io/cypress/issues/27611)) ([8b5c551](https://github.com/cypress-io/cypress/commit/8b5c551890024c6389b881e081114c6f1519ba98))

# [@cypress/webpack-batteries-included-preprocessor-v3.0.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.4.1...@cypress/webpack-batteries-included-preprocessor-v3.0.0) (2023-08-14)


### breaking

* support webpack v5 ([00fb578](https://github.com/cypress-io/cypress/commit/00fb5782eb47ffe46c774c7579157499e5e916e0))


### BREAKING CHANGES

* Since cypress now bundles with webpack v5, the minimum webpack version is now version 5 as this iswhat cypress will support in the monorepo moving forward. If you wish to use webpack 4, please use v2 of this package.

# [@cypress/webpack-batteries-included-preprocessor-v2.4.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.4.0...@cypress/webpack-batteries-included-preprocessor-v2.4.1) (2023-03-14)


### Bug Fixes

* Fix issues with Cypress.require() and TypeScript ([#25931](https://github.com/cypress-io/cypress/issues/25931)) ([ed69f0b](https://github.com/cypress-io/cypress/commit/ed69f0ba6772514c0c486c2c456375dd107b0297))

# [@cypress/webpack-batteries-included-preprocessor-v2.4.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.3.0...@cypress/webpack-batteries-included-preprocessor-v2.4.0) (2023-02-15)


### Features

* Bundle cy.origin() dependencies at runtime ([#25626](https://github.com/cypress-io/cypress/issues/25626)) ([41512c4](https://github.com/cypress-io/cypress/commit/41512c416a80e5158752fef9ffbe722402a5ada4))

# [@cypress/webpack-batteries-included-preprocessor-v2.3.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.2.4...@cypress/webpack-batteries-included-preprocessor-v2.3.0) (2022-12-02)


### Features

* Create public `Cypress.ensure` API for use with custom queries ([#24697](https://github.com/cypress-io/cypress/issues/24697)) ([8ff38cd](https://github.com/cypress-io/cypress/commit/8ff38cdb01adb1a4d317154d5baafa2eff5bad3d))

# [@cypress/webpack-batteries-included-preprocessor-v2.2.4](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.2.3...@cypress/webpack-batteries-included-preprocessor-v2.2.4) (2022-11-23)


### Bug Fixes

* fix windows-lint CI job ([#24758](https://github.com/cypress-io/cypress/issues/24758)) ([2166ba0](https://github.com/cypress-io/cypress/commit/2166ba0d9496037df843d55f07517f83817171a3))

# [@cypress/webpack-batteries-included-preprocessor-v2.2.3](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.2.2...@cypress/webpack-batteries-included-preprocessor-v2.2.3) (2021-07-31)


### Bug Fixes

* add yarn v2 pnp support to default webpack processor ([#17335](https://github.com/cypress-io/cypress/issues/17335)) ([74ada11](https://github.com/cypress-io/cypress/commit/74ada1157c1bf1b184e09873edb6868ae7a67f43))

# [@cypress/webpack-batteries-included-preprocessor-v2.2.2](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.2.1...@cypress/webpack-batteries-included-preprocessor-v2.2.2) (2021-06-24)


### Bug Fixes

* **webpack-batteries-included-preprocessor:** Disable loading babel config files ([#16980](https://github.com/cypress-io/cypress/issues/16980)) ([e1d2256](https://github.com/cypress-io/cypress/commit/e1d22561b34a48ed668e4909dfeba5f102f46250))

# [@cypress/webpack-batteries-included-preprocessor-v2.2.1](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.2.0...@cypress/webpack-batteries-included-preprocessor-v2.2.1) (2021-04-15)


### Bug Fixes

* **@cypress/webpack-batteries-included-preprocessor:** Ensure typescript options are set if typescript path is provided ([#15991](https://github.com/cypress-io/cypress/issues/15991)) ([6885181](https://github.com/cypress-io/cypress/commit/688518126297c08fbfa572fcef10ee9bbf49b6c8))

# [@cypress/webpack-batteries-included-preprocessor-v2.2.0](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.1.5...@cypress/webpack-batteries-included-preprocessor-v2.2.0) (2021-04-05)


### Features

* Target modern ES with default preprocessor ([#15274](https://github.com/cypress-io/cypress/issues/15274)) ([c449775](https://github.com/cypress-io/cypress/commit/c4497752d87470b26a9c94f3c6dc60e993e4a83e))

# [@cypress/webpack-batteries-included-preprocessor-v2.1.5](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.1.4...@cypress/webpack-batteries-included-preprocessor-v2.1.5) (2021-01-27)


### Bug Fixes

* ignore browserslist file ([#14754](https://github.com/cypress-io/cypress/issues/14754)) ([a21e76f](https://github.com/cypress-io/cypress/commit/a21e76fb0fb8706b4a188bc944137fb33030b42a))

# [@cypress/webpack-batteries-included-preprocessor-v2.1.4](https://github.com/cypress-io/cypress/compare/@cypress/webpack-batteries-included-preprocessor-v2.1.3...@cypress/webpack-batteries-included-preprocessor-v2.1.4) (2021-01-05)


### Bug Fixes

* update @cypress/npm-webpack-batteries-included-preprocessor for monorepo ([#14181](https://github.com/cypress-io/cypress/issues/14181)) ([5a3b133](https://github.com/cypress-io/cypress/commit/5a3b1338e0ec3edf6b60b47929d8a51faf3c9b85))
