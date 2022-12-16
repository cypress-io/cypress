# [@cypress/vue2-v2.0.1](https://github.com/cypress-io/cypress/compare/@cypress/vue2-v2.0.0...@cypress/vue2-v2.0.1) (2022-11-14)


### Bug Fixes

* vue2 global directives in component testing ([#24488](https://github.com/cypress-io/cypress/issues/24488)) ([741019d](https://github.com/cypress-io/cypress/commit/741019d9618b7be79db64c9039ebca07741dd5c7))

# [@cypress/vue2-v2.0.0](https://github.com/cypress-io/cypress/compare/@cypress/vue2-v1.1.2...@cypress/vue2-v2.0.0) (2022-11-07)


### Bug Fixes

* remove dependence on @cypress/<dep> types ([#24415](https://github.com/cypress-io/cypress/issues/24415)) ([58e0ab9](https://github.com/cypress-io/cypress/commit/58e0ab91604618ea6f75932622f7e66e419270e6))
* remove last mounted component upon subsequent mount calls ([#24470](https://github.com/cypress-io/cypress/issues/24470)) ([f39eb1c](https://github.com/cypress-io/cypress/commit/f39eb1c19e0923bda7ae263168fc6448da942d54))
* remove some CT functions and props ([#24419](https://github.com/cypress-io/cypress/issues/24419)) ([294985f](https://github.com/cypress-io/cypress/commit/294985f8b3e0fa00ed66d25f88c8814603766074))


### Features

* include component and wrapper in return type for vue mount adapter ([#24479](https://github.com/cypress-io/cypress/issues/24479)) ([33875d7](https://github.com/cypress-io/cypress/commit/33875d75505416b1f65ca7c6d5dedc46f3289f1b))


### BREAKING CHANGES

* remove last mounted component upon subsequent mount calls of mount
* Vue mount returns wrapper and component rather than wrapper only

# [@cypress/vue2-v1.1.2](https://github.com/cypress-io/cypress/compare/@cypress/vue2-v1.1.1...@cypress/vue2-v1.1.2) (2022-11-01)


### Bug Fixes

* Hovering over mount in command log does not show component in AUT ([#24346](https://github.com/cypress-io/cypress/issues/24346)) ([355d210](https://github.com/cypress-io/cypress/commit/355d2101d38ea4d1e93b9c571cf77babab2bbbfc))

# [@cypress/vue2-v1.1.1](https://github.com/cypress-io/cypress/compare/@cypress/vue2-v1.1.0...@cypress/vue2-v1.1.1) (2022-10-13)


### Bug Fixes

* angular and nuxt ct tests now fail on uncaught exceptions ([#24122](https://github.com/cypress-io/cypress/issues/24122)) ([53eef4f](https://github.com/cypress-io/cypress/commit/53eef4fbd7e1caf32f0183cadbc0e4cf05524c34))


# [@cypress/vue2-v1.1.0](https://github.com/cypress-io/cypress/compare/@cypress/vue2-v1.0.2...@cypress/vue2-v1.1.0) (2022-08-30)


### Features

* adding svelte component testing support ([#23553](https://github.com/cypress-io/cypress/issues/23553)) ([f6eaad4](https://github.com/cypress-io/cypress/commit/f6eaad40e1836fa9db87c60defa5ae6f390c8fd8))

# [@cypress/vue2-v1.0.2](https://github.com/cypress-io/cypress/compare/@cypress/vue2-v1.0.1...@cypress/vue2-v1.0.2) (2022-08-11)


### Bug Fixes

* remove CT side effects from mount when e2e testing ([#22633](https://github.com/cypress-io/cypress/issues/22633)) ([a9476ec](https://github.com/cypress-io/cypress/commit/a9476ecb3d43f628b689e060294a1952937cb1a7))

# [@cypress/vue2-v1.0.1](https://github.com/cypress-io/cypress/compare/@cypress/vue2-v1.0.0...@cypress/vue2-v1.0.1) (2022-06-13)


### Bug Fixes

* remove http npm registry link for vue2 ([0bd3069](https://github.com/cypress-io/cypress/commit/0bd306962bce2a32d7b87fc1811a7b9feeb63ae2))

# @cypress/vue2-v1.0.0 (2022-06-13)


### Bug Fixes

* add package.json metadata for webpack-dev-server ([#22292](https://github.com/cypress-io/cypress/issues/22292)) ([9cfec97](https://github.com/cypress-io/cypress/commit/9cfec9750f2ddc9fe691aabbe2ecc9bc02a3d915))
* display cy.mount command log ([#21500](https://github.com/cypress-io/cypress/issues/21500)) ([140b4ba](https://github.com/cypress-io/cypress/commit/140b4ba2110243712a614a39b2408c30cce4d0b1))
* Doc changes around vue2 ([#21066](https://github.com/cypress-io/cypress/issues/21066)) ([17905a7](https://github.com/cypress-io/cypress/commit/17905a79ee5106b0d72c8e74bb717fcd7b796dee))


### chore

* prep npm packages for use with Cypress v10 ([b924d08](https://github.com/cypress-io/cypress/commit/b924d086ee2e2ccc93303731e001b2c9e9d0af17))


### Features

* Add vue2 package from npm/vue/v2 branch ([#21026](https://github.com/cypress-io/cypress/issues/21026)) ([3aa69e2](https://github.com/cypress-io/cypress/commit/3aa69e2538aae5702bfc48789c54f37263ce08fc))
* swap the #__cy_root id selector to become data-cy-root for component mounting ([#20951](https://github.com/cypress-io/cypress/issues/20951)) ([0e7b555](https://github.com/cypress-io/cypress/commit/0e7b555f93fb403f431c5de4a07ae7ad6ac89ba2))


### BREAKING CHANGES

* new version of packages for Cypress v10

# @cypress/vue2-v1.0.0 (2021-06-17)

### Features

* Split out as separate package from `@cypress/vue`, based on the `npm/vue/v2` branch.
