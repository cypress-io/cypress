# [create-cypress-tests-v2.0.0](https://github.com/cypress-io/cypress/compare/create-cypress-tests-v1.3.0...create-cypress-tests-v2.0.0) (2022-06-13)


### Bug Fixes

* scope config to current testing type ([#20677](https://github.com/cypress-io/cypress/issues/20677)) ([61f7cfc](https://github.com/cypress-io/cypress/commit/61f7cfc59284a2938e0a1c15d74ee75215ba5f8b))
* support using create-cypress-tests as part of build process ([#18714](https://github.com/cypress-io/cypress/issues/18714)) ([0501452](https://github.com/cypress-io/cypress/commit/0501452fb9e2df954ee871171052ab9f01367b25))
* **unified-desktop-gui branch:** initial installation on windows ([#18247](https://github.com/cypress-io/cypress/issues/18247)) ([8614e97](https://github.com/cypress-io/cypress/commit/8614e978029bcbf7155b7ae98ac54feb11f2e7f3))


### chore

* prep npm packages for use with Cypress v10 ([b924d08](https://github.com/cypress-io/cypress/commit/b924d086ee2e2ccc93303731e001b2c9e9d0af17))


### Features

* Add vue2 package from npm/vue/v2 branch ([#21026](https://github.com/cypress-io/cypress/issues/21026)) ([3aa69e2](https://github.com/cypress-io/cypress/commit/3aa69e2538aae5702bfc48789c54f37263ce08fc))
* Deprecate run-ct / open-ct, and update all examples to use --ct instead ([#18422](https://github.com/cypress-io/cypress/issues/18422)) ([196e8f6](https://github.com/cypress-io/cypress/commit/196e8f62cc6d27974f235945cb5700624b3dae41))
* remove testFiles reference ([#20565](https://github.com/cypress-io/cypress/issues/20565)) ([5670344](https://github.com/cypress-io/cypress/commit/567034459089d9d53dfab5556cb9369fb335c3db))
* update on-links ([#19235](https://github.com/cypress-io/cypress/issues/19235)) ([cc2d734](https://github.com/cypress-io/cypress/commit/cc2d7348185e2a090c60d92d9319ab460d8c7827))
* Use .config files ([#18578](https://github.com/cypress-io/cypress/issues/18578)) ([081dd19](https://github.com/cypress-io/cypress/commit/081dd19cc6da3da229a7af9c84f62730c85a5cd6))
* use supportFile by testingType ([#19364](https://github.com/cypress-io/cypress/issues/19364)) ([0366d4f](https://github.com/cypress-io/cypress/commit/0366d4fa8971e5e5189c6fd6450cc3c8d72dcfe1))


### BREAKING CHANGES

* new version of packages for Cypress v10

# [create-cypress-tests-v1.3.0](https://github.com/cypress-io/cypress/compare/create-cypress-tests-v1.2.0...create-cypress-tests-v1.3.0) (2021-12-16)


### Bug Fixes

* Restore broken gif ([#18987](https://github.com/cypress-io/cypress/issues/18987)) ([f251681](https://github.com/cypress-io/cypress/commit/f251681b814b102ca374abdef148b777c4e72c67))


### Features

* use hoisted yarn install in binary build ([#17285](https://github.com/cypress-io/cypress/issues/17285)) ([e4f5b10](https://github.com/cypress-io/cypress/commit/e4f5b106d49d6ac0857c5fdac886f83b99558c88))

# [create-cypress-tests-v1.2.0](https://github.com/cypress-io/cypress/compare/create-cypress-tests-v1.1.3...create-cypress-tests-v1.2.0) (2021-11-10)


### Features

* **deps:** update dependency electron to v15 🌟 ([#18317](https://github.com/cypress-io/cypress/issues/18317)) ([3095d73](https://github.com/cypress-io/cypress/commit/3095d733e92527ffd67344c6899211e058ceefa3))

# [create-cypress-tests-v1.1.3](https://github.com/cypress-io/cypress/compare/create-cypress-tests-v1.1.2...create-cypress-tests-v1.1.3) (2021-10-29)


### Bug Fixes

* revive type checker ([#18172](https://github.com/cypress-io/cypress/issues/18172)) ([af472b6](https://github.com/cypress-io/cypress/commit/af472b6419ecb2aec1abdb09df99b2fa5f56e033))

# [create-cypress-tests-v1.1.2](https://github.com/cypress-io/cypress/compare/create-cypress-tests-v1.1.1...create-cypress-tests-v1.1.2) (2021-06-17)


### Bug Fixes

* case issue create cypress tests with `react/plugins/load-webpack` ([#16961](https://github.com/cypress-io/cypress/issues/16961)) ([c37ecea](https://github.com/cypress-io/cypress/commit/c37ecea3ca462015637515b331d1c9828ac1ed29)), closes [#16960](https://github.com/cypress-io/cypress/issues/16960)

# [create-cypress-tests-v1.1.1](https://github.com/cypress-io/cypress/compare/create-cypress-tests-v1.1.0...create-cypress-tests-v1.1.1) (2021-05-10)


### Bug Fixes

* add return config for vitejs templates ([69d9de5](https://github.com/cypress-io/cypress/commit/69d9de581a03dce8e3535917a4cdcea8fa4eb6e9))
* add return config for vueCli and vueWebpack ([9c12ee6](https://github.com/cypress-io/cypress/commit/9c12ee6d8467c65414ab2d413a9c45b2bbec64e9))
* remove all of rollup, not supported anymore ([f8a71e7](https://github.com/cypress-io/cypress/commit/f8a71e75ae8208dc628d342cb1054c12f98338e9))
* typo in the final message (run vs run-ct) ([294db04](https://github.com/cypress-io/cypress/commit/294db04f042dba86b69bb15d847c80a2c4202e80))
* vueCli and webpack key vue@2 fix when guessing ([89f1bb9](https://github.com/cypress-io/cypress/commit/89f1bb9bc6bd987fbf6679a9d955c3587e69aa61))

# [create-cypress-tests-v1.1.0](https://github.com/cypress-io/cypress/compare/create-cypress-tests-v1.0.1...create-cypress-tests-v1.1.0) (2021-04-05)


### Bug Fixes

* **component-testing:** Fix webpack-dev-server deps validation crash ([#15708](https://github.com/cypress-io/cypress/issues/15708)) ([254eb47](https://github.com/cypress-io/cypress/commit/254eb47d91c75a9f56162e7493ab83e5be169935))


### Features

* support ct/e2e specific overrides in cypress.json ([#15526](https://github.com/cypress-io/cypress/issues/15526)) ([43c8ae2](https://github.com/cypress-io/cypress/commit/43c8ae2a7c20ba70a0bb0b45b8f6a086e2782f29))

# [create-cypress-tests-v1.0.1](https://github.com/cypress-io/cypress/compare/create-cypress-tests-v1.0.0...create-cypress-tests-v1.0.1) (2021-03-16)


### Bug Fixes

* add missing script for building wizard ([#15502](https://github.com/cypress-io/cypress/issues/15502)) ([393a8ca](https://github.com/cypress-io/cypress/commit/393a8ca9cac905e0f6d8623bff889b041dd076b6))

# create-cypress-tests-v1.0.0 (2021-03-15)


### Bug Fixes

* **runner-ct:** open link in external browser ([#15420](https://github.com/cypress-io/cypress/issues/15420)) ([d291157](https://github.com/cypress-io/cypress/commit/d291157f07ffebe961527fdd85c7ec51056801e7))


### Features

* **@cypress/react:** Make correct plugins for different adapters/bundlers ([#15337](https://github.com/cypress-io/cypress/issues/15337)) ([fc30118](https://github.com/cypress-io/cypress/commit/fc301182523f0a645bfb17ea3b541644b9732dd0)), closes [#9116](https://github.com/cypress-io/cypress/issues/9116)
* create-cypress-tests installation wizard ([#9563](https://github.com/cypress-io/cypress/issues/9563)) ([c405ee8](https://github.com/cypress-io/cypress/commit/c405ee89ef5321df6151fdeec1e917ac952c0d38)), closes [#9116](https://github.com/cypress-io/cypress/issues/9116)
* create-cypress-tests wizard ([#8857](https://github.com/cypress-io/cypress/issues/8857)) ([21ee591](https://github.com/cypress-io/cypress/commit/21ee591d1e9c4083a0c67f2062ced92708c0cedd))
