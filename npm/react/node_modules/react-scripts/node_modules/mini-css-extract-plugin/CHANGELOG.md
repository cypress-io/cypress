# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.9.0](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.8.2...v0.9.0) (2019-12-20)


### Features

* new `esModule` option ([#475](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/475)) ([596e47a](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/596e47a8aead53f9cc0e2b1e09a2c20e455e45c1))

### [0.8.2](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.8.1...v0.8.2) (2019-12-17)


### Bug Fixes

* context for dependencies ([#474](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/474)) ([0269860](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/0269860adb0eaad477901188eea66693fedf7769))

### [0.8.1](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.8.0...v0.8.1) (2019-12-17)


### Bug Fixes

* use filename mutated after instantiation ([#430](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/430)) ([0bacfac](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/0bacfac7ef4a06b4810fbc140875f7a038caa5bc))
* improve warning of conflict order ([#465](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/465)) ([357d073](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/357d073bf0259f2c44e613ad4dfcbcc8354e4be3))
* support ES module syntax ([#472](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/472)) ([2f72e1a](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/2f72e1aa267de23f121441714e88406f579e77b2))

## [0.8.0](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.7.0...v0.8.0) (2019-07-16)


### Features

* Add ignoreOrder option ([#422](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/422)) ([4ad3373](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/4ad3373))



## [0.7.0](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.6.0...v0.7.0) (2019-05-27)


### Bug Fixes

* do not attempt to reload unrequestable urls ([#378](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/378)) ([44d00ea](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/44d00ea))
* fix `publicPath` regression ([#384](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/384)) ([582ebfe](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/582ebfe))
* enable using plugin without defining options ([#393](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/393)) ([a7dee8c](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/a7dee8c))
* downgrading normalize-url ([#399](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/399)) ([0dafaf6](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/0dafaf6))
* hmr do not crash on link without href ([#400](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/400)) ([aa9b541](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/aa9b541))
* hmr reload with invalid link url ([#402](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/402)) ([30a19b0](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/30a19b0))


### Features

* add `moduleFilename` option ([#381](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/381)) ([13e9cbf](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/13e9cbf))



<a name="0.6.0"></a>
# [0.6.0](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.5.0...v0.6.0) (2019-04-10)


### Features

* added error code to chunk load Error ([#347](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/347)) ([b653641](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/b653641))
* adding hot module reloading ([#334](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/334)) ([4ed9c5a](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/4ed9c5a))
* publicPath can be a function ([#373](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/373)) ([7b1425a](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/7b1425a))



<a name="0.5.0"></a>
# [0.5.0](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.4.5...v0.5.0) (2018-12-07)


### Features

* add crossOriginLoading option support ([#313](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/313)) ([ffb0d87](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/ffb0d87))



<a name="0.4.5"></a>
## [0.4.5](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.4.4...v0.4.5) (2018-11-21)


### Bug Fixes

* **index:** allow requesting failed async css files ([#292](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/292)) ([2eb0af5](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/2eb0af5))



<a name="0.4.4"></a>
## [0.4.4](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.4.3...v0.4.4) (2018-10-10)


### Bug Fixes

* **index:** assign empty `module.id` to prevent `contenthash` from changing unnecessarily ([#284](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/284)) ([d7946d0](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/d7946d0))



<a name="0.4.3"></a>
## [0.4.3](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.4.2...v0.4.3) (2018-09-18)


### Bug Fixes

* **loader:** pass `emitFile` to the child compilation (`loaderContext.emitFile`) ([#177](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/177)) ([18c066e](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/18c066e))



<a name="0.4.2"></a>
## [0.4.2](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.4.0...v0.4.2) (2018-08-21)


### Bug Fixes

* use correct order when multiple chunk groups are merged ([#246](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/246)) ([c3b363d](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/c3b363d))



<a name="0.4.1"></a>
## [0.4.1](https://github.com/webpack-contrib/mini-css-extract-plugin/compare/v0.4.0...v0.4.1) (2018-06-29)


### Bug Fixes

* CSS ordering with multiple entry points ([#130](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/130)) ([79373eb](https://github.com/webpack-contrib/mini-css-extract-plugin/commit/79373eb))



# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

x.x.x / <year>-<month>-<day>
==================

  * Bug fix -
  * Feature -
  * Chore -
  * Docs -
