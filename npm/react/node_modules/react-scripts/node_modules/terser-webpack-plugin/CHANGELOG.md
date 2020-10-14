# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.3.5](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.3.4...v2.3.5) (2020-02-14)


### Bug Fixes

* do not break code with shebang ([fac58cb](https://github.com/webpack-contrib/terser-webpack-plugin/commit/fac58cb1ee7935710b3b38662c3abbf8dc12a862))

### [2.3.4](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.3.3...v2.3.4) (2020-01-30)


### Bug Fixes

* respect stdout and stderr of workers and do not create warnings ([#215](https://github.com/webpack-contrib/terser-webpack-plugin/issues/215)) ([5708574](https://github.com/webpack-contrib/terser-webpack-plugin/commit/5708574d3337158a02d60a81275467900da5f42d))
* use webpack hash options rather than hard-code MD4 ([#213](https://github.com/webpack-contrib/terser-webpack-plugin/issues/213)) ([330c1f6](https://github.com/webpack-contrib/terser-webpack-plugin/commit/330c1f6cf3468fd6312e86960b272df1591f1a64))

### [2.3.3](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.3.2...v2.3.3) (2020-01-28)


### Bug Fixes

* license files now have .txt suffix by default ([#210](https://github.com/webpack-contrib/terser-webpack-plugin/issues/210)) ([de02f7b](https://github.com/webpack-contrib/terser-webpack-plugin/commit/de02f7b229a6ef91baa353681b1c546784672ab6))
* reduce memory usage ([abfd950](https://github.com/webpack-contrib/terser-webpack-plugin/commit/abfd9506207cf392de63a0629de82145efff2361))

### [2.3.2](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.3.1...v2.3.2) (2020-01-09)


### Bug Fixes

* show error message from jest-worker ([#203](https://github.com/webpack-contrib/terser-webpack-plugin/issues/203)) ([3b28007](https://github.com/webpack-contrib/terser-webpack-plugin/commit/3b280070cde3b233ae703fe2e0ac75b350cb2da7))

### [2.3.1](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.3.0...v2.3.1) (2019-12-17)


### Bug Fixes

* performance ([#200](https://github.com/webpack-contrib/terser-webpack-plugin/issues/200)) ([d2acd75](https://github.com/webpack-contrib/terser-webpack-plugin/commit/d2acd75f4b630af38d2c272f800e755fe395b2dd))

## [2.3.0](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.2.3...v2.3.0) (2019-12-12)


### Features

* support webpack@5 cache ([3649b3d](https://github.com/webpack-contrib/terser-webpack-plugin/commit/3649b3d0bf697288661676b47b33ae88226eb6f5))

### [2.2.3](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.2.2...v2.2.3) (2019-12-11)

### SECURITY

* update `serialize-javascript` to `2.1.2` version.

### [2.2.2](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.2.1...v2.2.2) (2019-12-06)


### SECURITY

* update `serialize-javascript` to `2.1.1` version.

### [2.2.1](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.2.0...v2.2.1) (2019-10-22)


### Bug Fixes

* get rid deprecation warnings for webpack@5 ([#181](https://github.com/webpack-contrib/terser-webpack-plugin/issues/181)) ([0e9b780](https://github.com/webpack-contrib/terser-webpack-plugin/commit/0e9b780390826a9b9f58368f24b39452ca34f00e))

## [2.2.0](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.1.3...v2.2.0) (2019-10-22)


### Features

* map `webpack@5` options to `terser` options ([#177](https://github.com/webpack-contrib/terser-webpack-plugin/issues/177)) ([f4c47aa](https://github.com/webpack-contrib/terser-webpack-plugin/commit/f4c47aa0e3de27bbab3ae0a90a461841bbce5988))
* pass an asset path for the `warningsFilter` option ([#176](https://github.com/webpack-contrib/terser-webpack-plugin/issues/176)) ([9a0a575](https://github.com/webpack-contrib/terser-webpack-plugin/commit/9a0a575585be21118cb4e3611d30e665a6337c3d))
* propagate an error stacktrace from `terser` ([#179](https://github.com/webpack-contrib/terser-webpack-plugin/issues/179)) ([a11e66b](https://github.com/webpack-contrib/terser-webpack-plugin/commit/a11e66b17ae2bb146ded4e64c948d5eece834378))
* enable the `sourceMap` option when the `SourceMapDevToolPlugin` plugin used (non cheap) ([#178](https://github.com/webpack-contrib/terser-webpack-plugin/issues/178)) ([d01c1b5](https://github.com/webpack-contrib/terser-webpack-plugin/commit/d01c1b5fef7f0593c91c1be3d4eb36220c3f465d))


### Bug Fixes

* get rid deprecation warnings for `webpack@5` ([#180](https://github.com/webpack-contrib/terser-webpack-plugin/issues/180)) ([504ea8b](https://github.com/webpack-contrib/terser-webpack-plugin/commit/504ea8b2017e6fa9b8a5f2123025ee5b7b4d80b1))

### [2.1.3](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.1.2...v2.1.3) (2019-10-10)


### Bug Fixes

* invalidate cache when a file name was changed ([#171](https://github.com/webpack-contrib/terser-webpack-plugin/issues/171)) ([7e1d370](https://github.com/webpack-contrib/terser-webpack-plugin/commit/7e1d370ce2520c7c23689c19b22cfbea0265957e))

### [2.1.2](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.1.1...v2.1.2) (2019-09-28)


### Bug Fixes

* regexp for `some` comments ([#168](https://github.com/webpack-contrib/terser-webpack-plugin/issues/168)) ([4c4b1f1](https://github.com/webpack-contrib/terser-webpack-plugin/commit/4c4b1f1))

### [2.1.1](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.1.0...v2.1.1) (2019-09-27)


### Bug Fixes

* logic for extracting and preserving comments ([#166](https://github.com/webpack-contrib/terser-webpack-plugin/issues/166)) ([6bdee64](https://github.com/webpack-contrib/terser-webpack-plugin/commit/6bdee64))

## [2.1.0](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.0.1...v2.1.0) (2019-09-16)


### Bug Fixes

* correct interpretation url for extracted comment file ([#157](https://github.com/webpack-contrib/terser-webpack-plugin/issues/157)) ([aba8ba7](https://github.com/webpack-contrib/terser-webpack-plugin/commit/aba8ba7))


### Features

* emit warning when comment file conlict with an existing asset ([#156](https://github.com/webpack-contrib/terser-webpack-plugin/issues/156)) ([2b4d2a4](https://github.com/webpack-contrib/terser-webpack-plugin/commit/2b4d2a4))
* improve naming of extracted file with comments ([#154](https://github.com/webpack-contrib/terser-webpack-plugin/issues/154)) ([5fe3337](https://github.com/webpack-contrib/terser-webpack-plugin/commit/5fe3337))

### [2.0.1](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v2.0.0...v2.0.1) (2019-09-06)


### Bug Fixes

* reduce memory usage ([#145](https://github.com/webpack-contrib/terser-webpack-plugin/issues/145)) ([815e533](https://github.com/webpack-contrib/terser-webpack-plugin/commit/815e533))
* revert do not run parallel mode when you have only one file ([#146](https://github.com/webpack-contrib/terser-webpack-plugin/issues/146)) ([6613a97](https://github.com/webpack-contrib/terser-webpack-plugin/commit/6613a97))

## [2.0.0](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.4.1...v2.0.0) (2019-09-05)


### ⚠ BREAKING CHANGES

* minimum require Node.js version is `8.9.0`
* the `extractComments` option is `true` by default
* the `cache` option is `true` by default
* the `parallel` option is `true` by default
* using the `extractComments.condition` option with `true` value extract only `some` comments
* the `sourceMap` option now defaults to depending on the `devtool` Webpack option


### Bug Fixes

* do not run parallel mode when you have only one file ([#134](https://github.com/webpack-contrib/terser-webpack-plugin/issues/134)) ([8b88b39](https://github.com/webpack-contrib/terser-webpack-plugin/commit/8b88b39))
* make `extractComments` API more consistent ([#129](https://github.com/webpack-contrib/terser-webpack-plugin/issues/129)) ([37d2df0](https://github.com/webpack-contrib/terser-webpack-plugin/commit/37d2df0))
* parallel on wsl ([#138](https://github.com/webpack-contrib/terser-webpack-plugin/issues/138)) ([0537591](https://github.com/webpack-contrib/terser-webpack-plugin/commit/0537591))


### Features

* enable the cache option by default ([#132](https://github.com/webpack-contrib/terser-webpack-plugin/issues/132)) ([960d249](https://github.com/webpack-contrib/terser-webpack-plugin/commit/960d249))
* enable the extractComments option by default ([ad2471c](https://github.com/webpack-contrib/terser-webpack-plugin/commit/ad2471c))
* enable the parallel option by default ([#131](https://github.com/webpack-contrib/terser-webpack-plugin/issues/131)) ([7b342af](https://github.com/webpack-contrib/terser-webpack-plugin/commit/7b342af))
* respect `devtool` values for source map generation ([#140](https://github.com/webpack-contrib/terser-webpack-plugin/issues/140)) ([dd37ca1](https://github.com/webpack-contrib/terser-webpack-plugin/commit/dd37ca1))

### [1.4.1](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.4.0...v1.4.1) (2019-07-31)


### Bug Fixes

* removed unnecessary dependency ([#111](https://github.com/webpack-contrib/terser-webpack-plugin/issues/111)) ([bc19b72](https://github.com/webpack-contrib/terser-webpack-plugin/commit/bc19b72))

## [1.4.0](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.3.0...v1.4.0) (2019-07-31)


### Features

* generate higher quality SourceMaps ([#109](https://github.com/webpack-contrib/terser-webpack-plugin/issues/109)) ([9d777f0](https://github.com/webpack-contrib/terser-webpack-plugin/commit/9d777f0))

## [1.3.0](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.2.4...v1.3.0) (2019-05-24)


### Features

* update terser to 4 version ([#97](https://github.com/webpack-contrib/terser-webpack-plugin/issues/97)) ([15d1595](https://github.com/webpack-contrib/terser-webpack-plugin/commit/15d1595))



### [1.2.4](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.2.3...v1.2.4) (2019-05-15)


### Bug Fixes

* disable parallel on WSL due bugs ([#90](https://github.com/webpack-contrib/terser-webpack-plugin/issues/90)) ([d9533dd](https://github.com/webpack-contrib/terser-webpack-plugin/commit/d9533dd))
* fallback for cache directory ([#86](https://github.com/webpack-contrib/terser-webpack-plugin/issues/86)) ([3cdd2ed](https://github.com/webpack-contrib/terser-webpack-plugin/commit/3cdd2ed))



<a name="1.2.3"></a>
## [1.2.3](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.2.2...v1.2.3) (2019-02-25)


### Bug Fixes

* invalidate cache after changing node version ([675edfd](https://github.com/webpack-contrib/terser-webpack-plugin/commit/675edfd))



<a name="1.2.2"></a>
## [1.2.2](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.2.1...v1.2.2) (2019-02-04)


### Bug Fixes

* cannot read property 'minify' of undefined   ([#69](https://github.com/webpack-contrib/terser-webpack-plugin/issues/69)) ([0593d7c](https://github.com/webpack-contrib/terser-webpack-plugin/commit/0593d7c))



<a name="1.2.1"></a>
## [1.2.1](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.2.0...v1.2.1) (2018-12-27)


### Bug Fixes

* don't crash when no extracted comments ([#49](https://github.com/webpack-contrib/terser-webpack-plugin/issues/49)) ([efad586](https://github.com/webpack-contrib/terser-webpack-plugin/commit/efad586))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.1.0...v1.2.0) (2018-12-22)


### Bug Fixes

* `chunks` is a `Set` in webpack@5 ([#19](https://github.com/webpack-contrib/terser-webpack-plugin/issues/19)) ([df8c425](https://github.com/webpack-contrib/terser-webpack-plugin/commit/df8c425))
* catch `work-farm` errors ([#35](https://github.com/webpack-contrib/terser-webpack-plugin/issues/35)) ([2bdcd38](https://github.com/webpack-contrib/terser-webpack-plugin/commit/2bdcd38))
* dedupe extracted comments ([#40](https://github.com/webpack-contrib/terser-webpack-plugin/issues/40)) ([7f4a159](https://github.com/webpack-contrib/terser-webpack-plugin/commit/7f4a159))
* more consistent cache ([#43](https://github.com/webpack-contrib/terser-webpack-plugin/issues/43)) ([36f5f3c](https://github.com/webpack-contrib/terser-webpack-plugin/commit/36f5f3c))
* regenerate `contenthash` when assets was uglified ([#44](https://github.com/webpack-contrib/terser-webpack-plugin/issues/44)) ([7e6f8b1](https://github.com/webpack-contrib/terser-webpack-plugin/commit/7e6f8b1))


### Features

* `chunkFilter` option for filtering chunks ([#38](https://github.com/webpack-contrib/terser-webpack-plugin/issues/38)) ([7ffe57c](https://github.com/webpack-contrib/terser-webpack-plugin/commit/7ffe57c))
* uglify `mjs` by default ([#39](https://github.com/webpack-contrib/terser-webpack-plugin/issues/39)) ([1644620](https://github.com/webpack-contrib/terser-webpack-plugin/commit/1644620))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.0.1...v1.1.0) (2018-09-14)


### Bug Fixes

* extract comment conditions is case insensitivity ([19e1e43](https://github.com/webpack-contrib/terser-webpack-plugin/commit/19e1e43))


### Features

* full coverage schema options validation ([#8](https://github.com/webpack-contrib/terser-webpack-plugin/issues/8)) ([68e531e](https://github.com/webpack-contrib/terser-webpack-plugin/commit/68e531e))



<a name="1.0.2"></a>
## [1.0.2](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.0.1...v1.0.2) (2018-08-16)


### Internal

* migrate from `@webpack-contrib/schema-utils` to `schema-utils` ([a5432da](https://github.com/webpack-contrib/terser-webpack-plugin/commit/a5432da))

<a name="1.0.1"></a>
## [1.0.1](https://github.com/webpack-contrib/terser-webpack-plugin/compare/v1.0.0...v1.0.1) (2018-08-15)


### Bug Fixes

* `cpus` length in a chroot environment (`os.cpus()`) ([#4](https://github.com/webpack-contrib/terser-webpack-plugin/issues/4)) ([9375646](https://github.com/webpack-contrib/terser-webpack-plugin/commit/9375646))



<a name="1.0.0"></a>
# 1.0.0 (2018-08-02)

Initial publish release

# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
