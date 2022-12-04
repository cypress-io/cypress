# [@cypress/mount-utils-v4.0.0](https://github.com/cypress-io/cypress/compare/@cypress/mount-utils-v3.0.0...@cypress/mount-utils-v4.0.0) (2022-12-02)


### chore

* remove experimentalSessionAndOrigin flag ([#24340](https://github.com/cypress-io/cypress/issues/24340)) ([69873ae](https://github.com/cypress-io/cypress/commit/69873ae9884228f15310fd151e42cbc0cb712817))


### BREAKING CHANGES

* removed experimentalSessionAndOrigin flag. testIsolation defaults to strict

# [@cypress/mount-utils-v3.0.0](https://github.com/cypress-io/cypress/compare/@cypress/mount-utils-v2.1.0...@cypress/mount-utils-v3.0.0) (2022-11-07)


### Bug Fixes

* remove dependence on @cypress/<dep> types ([#24415](https://github.com/cypress-io/cypress/issues/24415)) ([58e0ab9](https://github.com/cypress-io/cypress/commit/58e0ab91604618ea6f75932622f7e66e419270e6))
* remove last mounted component upon subsequent mount calls ([#24470](https://github.com/cypress-io/cypress/issues/24470)) ([f39eb1c](https://github.com/cypress-io/cypress/commit/f39eb1c19e0923bda7ae263168fc6448da942d54))
* remove some CT functions and props ([#24419](https://github.com/cypress-io/cypress/issues/24419)) ([294985f](https://github.com/cypress-io/cypress/commit/294985f8b3e0fa00ed66d25f88c8814603766074))


### BREAKING CHANGES

* remove last mounted component upon subsequent mount calls of mount

# [@cypress/mount-utils-v2.1.0](https://github.com/cypress-io/cypress/compare/@cypress/mount-utils-v2.0.1...@cypress/mount-utils-v2.1.0) (2022-08-30)


### Features

* adding svelte component testing support ([#23553](https://github.com/cypress-io/cypress/issues/23553)) ([f6eaad4](https://github.com/cypress-io/cypress/commit/f6eaad40e1836fa9db87c60defa5ae6f390c8fd8))

# [@cypress/mount-utils-v2.0.1](https://github.com/cypress-io/cypress/compare/@cypress/mount-utils-v2.0.0...@cypress/mount-utils-v2.0.1) (2022-08-11)


### Bug Fixes

* remove CT side effects from mount when e2e testing ([#22633](https://github.com/cypress-io/cypress/issues/22633)) ([a9476ec](https://github.com/cypress-io/cypress/commit/a9476ecb3d43f628b689e060294a1952937cb1a7))

# [@cypress/mount-utils-v2.0.0](https://github.com/cypress-io/cypress/compare/@cypress/mount-utils-v1.0.2...@cypress/mount-utils-v2.0.0) (2022-06-13)


### chore

* prep npm packages for use with Cypress v10 ([b924d08](https://github.com/cypress-io/cypress/commit/b924d086ee2e2ccc93303731e001b2c9e9d0af17))


### Features

* embedding mount into the cypress binary (real dependency) ([#20930](https://github.com/cypress-io/cypress/issues/20930)) ([3fe5f50](https://github.com/cypress-io/cypress/commit/3fe5f50e7832a4bfb20df8e71648434eb7f263d5))
* swap the #__cy_root id selector to become data-cy-root for component mounting ([#20951](https://github.com/cypress-io/cypress/issues/20951)) ([0e7b555](https://github.com/cypress-io/cypress/commit/0e7b555f93fb403f431c5de4a07ae7ad6ac89ba2))


### BREAKING CHANGES

* new version of packages for Cypress v10

# [@cypress/mount-utils-v1.0.2](https://github.com/cypress-io/cypress/compare/@cypress/mount-utils-v1.0.1...@cypress/mount-utils-v1.0.2) (2021-04-30)


### Bug Fixes

* avoid unmounting React components twice ([#16280](https://github.com/cypress-io/cypress/issues/16280)) ([bd629d3](https://github.com/cypress-io/cypress/commit/bd629d307eca9165b2c6f44ff87164a9e07a3eb5))

# [@cypress/mount-utils-v1.0.1](https://github.com/cypress-io/cypress/compare/@cypress/mount-utils-v1.0.0...@cypress/mount-utils-v1.0.1) (2021-04-26)


### Bug Fixes

* **webpack-dev-server:** remove hard dependency on html-webpack-plugin v4  ([#16108](https://github.com/cypress-io/cypress/issues/16108)) ([4cfe4b1](https://github.com/cypress-io/cypress/commit/4cfe4b1971c615d615c05ce35b9f7dd5ef8315fc))

# @cypress/mount-utils-v1.0.0 (2021-04-21)


### Bug Fixes

* improve handling of userland injected styles in component testing ([#16024](https://github.com/cypress-io/cypress/issues/16024)) ([fe0b63c](https://github.com/cypress-io/cypress/commit/fe0b63c299947470c9cdce3a0d00364a1e224bdb))
