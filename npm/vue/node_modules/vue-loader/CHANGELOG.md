<a name="15.9.3"></a>
## [15.9.3](https://github.com/vuejs/vue-loader/compare/v15.9.2...v15.9.3) (2020-06-23)


### Bug Fixes

* skip matching rule with 'enforce' ([e7b2b11](https://github.com/vuejs/vue-loader/commit/e7b2b11)), closes [#1680](https://github.com/vuejs/vue-loader/issues/1680)



<a name="15.9.2"></a>
## [15.9.2](https://github.com/vuejs/vue-loader/compare/v15.9.1...v15.9.2) (2020-05-01)


### Bug Fixes

* fix getting shadow root when component is functional ([#1560](https://github.com/vuejs/vue-loader/issues/1560)) ([9a7357a](https://github.com/vuejs/vue-loader/commit/9a7357a))


### Documentation

* add DocSearch as recommended by vuepress ([#1662](https://github.com/vuejs/vue-loader/issues/1662)) ([032d56b](https://github.com/vuejs/vue-loader/commit/032d56b))



<a name="15.9.1"></a>
## [15.9.1](https://github.com/vuejs/vue-loader/compare/v15.9.0...v15.9.1) (2020-03-19)


### Bug Fixes

* ensure unique `ident` when cloning rules, fix webpack 5 compatibility ([#1653](https://github.com/vuejs/vue-loader/issues/1653)) ([84c34a4](https://github.com/vuejs/vue-loader/commit/84c34a4))



<a name="15.9.0"></a>
# [15.9.0](https://github.com/vuejs/vue-loader/compare/v15.8.3...v15.9.0) (2020-02-12)


### Bug Fixes

* add vue-template-compiler as an optional peer dependency ([56db1d7](https://github.com/vuejs/vue-loader/commit/56db1d7)), closes [#1639](https://github.com/vuejs/vue-loader/issues/1639)


### Features

* support Rule.rules (nested rules) ([#1618](https://github.com/vuejs/vue-loader/issues/1618)) ([5943319](https://github.com/vuejs/vue-loader/commit/5943319))



<a name="15.8.3"></a>
## [15.8.3](https://github.com/vuejs/vue-loader/compare/v15.8.2...v15.8.3) (2019-12-16)



<a name="15.8.2"></a>
## [15.8.2](https://github.com/vuejs/vue-loader/compare/v15.8.1...v15.8.2) (2019-12-16)


### Bug Fixes

* fix compatibility with webpack 3 ([745d054](https://github.com/vuejs/vue-loader/commit/745d054))



<a name="15.8.0"></a>
# [15.8.0](https://github.com/vuejs/vue-loader/compare/v15.7.2...v15.8.0) (2019-12-16)


### Bug Fixes

* **types:** should import type definition from the `dist` folder ([0751213](https://github.com/vuejs/vue-loader/commit/0751213))


### Features

* add support for webpack5 ([#1613](https://github.com/vuejs/vue-loader/issues/1613)) ([59eebca](https://github.com/vuejs/vue-loader/commit/59eebca))



<a name="15.7.2"></a>
## [15.7.2](https://github.com/vuejs/vue-loader/compare/v15.7.1...v15.7.2) (2019-11-02)


### Bug Fixes

* add cache-loader to optional peer dependency ([e9d8b71](https://github.com/vuejs/vue-loader/commit/e9d8b71))
* use `require.resolve` when referencing `cache-loader` ([#1585](https://github.com/vuejs/vue-loader/issues/1585)) ([d3fa467](https://github.com/vuejs/vue-loader/commit/d3fa467))



<a name="15.7.1"></a>
## [15.7.1](https://github.com/vuejs/vue-loader/compare/v15.7.0...v15.7.1) (2019-07-18)


### Bug Fixes

* use "api.isRecorded" instead of "module.hot.data" ([#1569](https://github.com/vuejs/vue-loader/issues/1569)) ([6a05115](https://github.com/vuejs/vue-loader/commit/6a05115))



<a name="15.7.0"></a>
# [15.7.0](https://github.com/vuejs/vue-loader/compare/v15.6.4...v15.7.0) (2019-02-28)


### Features

* support post loaders for template blocks ([#1500](https://github.com/vuejs/vue-loader/issues/1500)) ([731a7ad](https://github.com/vuejs/vue-loader/commit/731a7ad))



<a name="15.6.4"></a>
## [15.6.4](https://github.com/vuejs/vue-loader/compare/v15.6.0...v15.6.4) (2019-02-19)


### Bug Fixes

* **templateLoder:** honor options.productionMode ([#1409](https://github.com/vuejs/vue-loader/issues/1409)) ([01990d0](https://github.com/vuejs/vue-loader/commit/01990d0))
* avoid generating custom block when there is only cache-loader ([#1493](https://github.com/vuejs/vue-loader/issues/1493)) ([a1af343](https://github.com/vuejs/vue-loader/commit/a1af343))
* fix wrong outputSourceRange usage ([#1482](https://github.com/vuejs/vue-loader/issues/1482)) ([2d96215](https://github.com/vuejs/vue-loader/commit/2d96215))
* keep style index consistent when filtering styles ([#1496](https://github.com/vuejs/vue-loader/issues/1496)) ([e02d937](https://github.com/vuejs/vue-loader/commit/e02d937))
* relay correct error message on vue-template-compiler version mismatch ([fdd0338](https://github.com/vuejs/vue-loader/commit/fdd0338))



<a name="15.6.3"></a>
## [15.6.3](https://github.com/vuejs/vue-loader/compare/v15.6.2...v15.6.3) (2019-02-18)


### Bug Fixes

* **templateLoder:** honor options.productionMode ([#1409](https://github.com/vuejs/vue-loader/issues/1409)) ([01990d0](https://github.com/vuejs/vue-loader/commit/01990d0))
* avoid generating custom block when there is only cache-loader ([#1493](https://github.com/vuejs/vue-loader/issues/1493)) ([a1af343](https://github.com/vuejs/vue-loader/commit/a1af343))



<a name="15.6.2"></a>
## [15.6.2](https://github.com/vuejs/vue-loader/compare/v15.6.1...v15.6.2) (2019-01-27)


### Bug Fixes

* fix wrong outputSourceRange usage ([#1482](https://github.com/vuejs/vue-loader/issues/1482)) ([2d96215](https://github.com/vuejs/vue-loader/commit/2d96215))



<a name="15.6.1"></a>
## [15.6.1](https://github.com/vuejs/vue-loader/compare/v15.6.0...v15.6.1) (2019-01-25)


### Bug Fixes

* relay correct error message on vue-template-compiler version mismatch ([fdd0338](https://github.com/vuejs/vue-loader/commit/fdd0338))



<a name="15.6.0"></a>
# [15.6.0](https://github.com/vuejs/vue-loader/compare/v15.5.1...v15.6.0) (2019-01-23)


### Bug Fixes

* template comments replace windows \ to / confirm consistent hash ([#1477](https://github.com/vuejs/vue-loader/issues/1477)) ([adc6dd6](https://github.com/vuejs/vue-loader/commit/adc6dd6))


### Features

* make `__file` injection opt-in in production ([#1475](https://github.com/vuejs/vue-loader/issues/1475)) ([001382d](https://github.com/vuejs/vue-loader/commit/001382d))
* support for compiler 2.6 outputSourceRange ([2215585](https://github.com/vuejs/vue-loader/commit/2215585))
* support webpack 5 hooks ([#1469](https://github.com/vuejs/vue-loader/issues/1469)) ([7275ae4](https://github.com/vuejs/vue-loader/commit/7275ae4))



<a name="15.5.1"></a>
## [15.5.1](https://github.com/vuejs/vue-loader/compare/v15.5.0...v15.5.1) (2019-01-08)


### Bug Fixes

* avoid to generate empty css chunk files ([#1464](https://github.com/vuejs/vue-loader/issues/1464)) ([c444ab6](https://github.com/vuejs/vue-loader/commit/c444ab6))



<a name="15.5.0"></a>
# [15.5.0](https://github.com/vuejs/vue-loader/compare/v15.4.0...v15.5.0) (2019-01-04)


### Bug Fixes

* css modules extends error ([#1452](https://github.com/vuejs/vue-loader/issues/1452)) ([082c6ea](https://github.com/vuejs/vue-loader/commit/082c6ea)), closes [#1449](https://github.com/vuejs/vue-loader/issues/1449)
* hide ext appending behind a flag (ref [#1372](https://github.com/vuejs/vue-loader/issues/1372)) ([f0beed3](https://github.com/vuejs/vue-loader/commit/f0beed3))
* include query in loader dedupe ([4a894de](https://github.com/vuejs/vue-loader/commit/4a894de)), closes [vue-cli#2451](https://github.com/vue-cli/issues/2451)


### Features

* add `prettify` option ([#1461](https://github.com/vuejs/vue-loader/issues/1461)) ([62a9155](https://github.com/vuejs/vue-loader/commit/62a9155)), closes [#1426](https://github.com/vuejs/vue-loader/issues/1426)



<a name="15.4.2"></a>
## [15.4.2](https://github.com/vuejs/vue-loader/compare/v15.4.1...v15.4.2) (2018-09-11)


### Bug Fixes

* include query in loader dedupe ([4a894de](https://github.com/vuejs/vue-loader/commit/4a894de)), closes [vue-cli#2451](https://github.com/vue-cli/issues/2451)



<a name="15.4.1"></a>
## [15.4.1](https://github.com/vuejs/vue-loader/compare/v15.4.0...v15.4.1) (2018-08-26)


### Bug Fixes

* hide ext appending behind a flag (ref [#1372](https://github.com/vuejs/vue-loader/issues/1372)) ([f0beed3](https://github.com/vuejs/vue-loader/commit/f0beed3))



<a name="15.4.0"></a>
# [15.4.0](https://github.com/vuejs/vue-loader/compare/v15.3.0...v15.4.0) (2018-08-20)


### Bug Fixes

* fix inconsistent path between Windows and POSIX systems (‏ ([#1384](https://github.com/vuejs/vue-loader/issues/1384) ([74a7dbd](https://github.com/vuejs/vue-loader/commit/74a7dbd))


### Features

* append the file extension to the mapping files in devtools ([#1372](https://github.com/vuejs/vue-loader/issues/1372)) ([0c2da0f](https://github.com/vuejs/vue-loader/commit/0c2da0f)), closes [#1371](https://github.com/vuejs/vue-loader/issues/1371)



<a name="15.3.0"></a>
# [15.3.0](https://github.com/vuejs/vue-loader/compare/v15.2.7...v15.3.0) (2018-08-07)


### Bug Fixes

* avoid absolute path in cache-loader inline options ([c6ab50a](https://github.com/vuejs/vue-loader/commit/c6ab50a)), closes [#1367](https://github.com/vuejs/vue-loader/issues/1367)


### Features

* set file basename to __file in production ([#1368](https://github.com/vuejs/vue-loader/issues/1368)) ([2f441b9](https://github.com/vuejs/vue-loader/commit/2f441b9))



<a name="15.2.7"></a>
## [15.2.7](https://github.com/vuejs/vue-loader/compare/v15.2.6...v15.2.7) (2018-08-07)



<a name="15.2.6"></a>
## [15.2.6](https://github.com/vuejs/vue-loader/compare/v15.2.5...v15.2.6) (2018-07-18)


### Bug Fixes

* ensure consistent component id on different OS ([0766fe7](https://github.com/vuejs/vue-loader/commit/0766fe7)), closes [vuejs/vue-cli#1728](https://github.com/vuejs/vue-cli/issues/1728)



<a name="15.2.5"></a>
## [15.2.5](https://github.com/vuejs/vue-loader/compare/v15.2.4...v15.2.5) (2018-07-17)


### Bug Fixes

* ensure same compiler is used for both parse and tempalte compilation ([1bfc08a](https://github.com/vuejs/vue-loader/commit/1bfc08a))
* should not remove eslint-loader on src import blocks (close [#1359](https://github.com/vuejs/vue-loader/issues/1359)) ([6f1d404](https://github.com/vuejs/vue-loader/commit/6f1d404))
* support usage with other loaders with enforce: post ([be2384c](https://github.com/vuejs/vue-loader/commit/be2384c)), closes [#1351](https://github.com/vuejs/vue-loader/issues/1351)


### Features

* inherit root request query in custom block loaders ([#1330](https://github.com/vuejs/vue-loader/issues/1330)) ([0f0b09b](https://github.com/vuejs/vue-loader/commit/0f0b09b))



<a name="15.2.4"></a>
## [15.2.4](https://github.com/vuejs/vue-loader/compare/v15.2.2...v15.2.4) (2018-06-01)


### Bug Fixes

* ensure plugin error is emitted only once ([0b006a3](https://github.com/vuejs/vue-loader/commit/0b006a3))
* fix unexpected error when options of cache-loader contains ! ([#1334](https://github.com/vuejs/vue-loader/issues/1334)) ([c4a2719](https://github.com/vuejs/vue-loader/commit/c4a2719))
* use constant plugin NS ([0fb5172](https://github.com/vuejs/vue-loader/commit/0fb5172)), closes [#1331](https://github.com/vuejs/vue-loader/issues/1331)


### Features

* inject issuerPath to resourceQuery for custom block src imports ([#1313](https://github.com/vuejs/vue-loader/issues/1313)) ([a004e30](https://github.com/vuejs/vue-loader/commit/a004e30))



<a name="15.2.3"></a>
## [15.2.3](https://github.com/vuejs/vue-loader/compare/v15.2.2...v15.2.3) (2018-06-01)


### Bug Fixes

* ensure plugin error is emitted only once ([0b006a3](https://github.com/vuejs/vue-loader/commit/0b006a3))
* use constant plugin NS ([0fb5172](https://github.com/vuejs/vue-loader/commit/0fb5172)), closes [#1331](https://github.com/vuejs/vue-loader/issues/1331)


### Features

* inject issuerPath to resourceQuery for custom block src imports ([#1313](https://github.com/vuejs/vue-loader/issues/1313)) ([a004e30](https://github.com/vuejs/vue-loader/commit/a004e30))



<a name="15.2.2"></a>
## [15.2.2](https://github.com/vuejs/vue-loader/compare/v15.2.0...v15.2.2) (2018-05-28)


### Bug Fixes

* check loader for cnpm(npminstall) ([#1321](https://github.com/vuejs/vue-loader/issues/1321)) ([37fbaeb](https://github.com/vuejs/vue-loader/commit/37fbaeb))
* ensure template cache uses unique identifier ([538198e](https://github.com/vuejs/vue-loader/commit/538198e))



<a name="15.2.1"></a>
## [15.2.1](https://github.com/vuejs/vue-loader/compare/v15.2.0...v15.2.1) (2018-05-25)


### Bug Fixes

* ensure template cache uses unique identifier ([bdb13be](https://github.com/vuejs/vue-loader/commit/bdb13be))



<a name="15.2.0"></a>
# [15.2.0](https://github.com/vuejs/vue-loader/compare/v15.1.0...v15.2.0) (2018-05-22)


### Features

* enable template compile caching ([28e0fd3](https://github.com/vuejs/vue-loader/commit/28e0fd3))



<a name="15.1.0"></a>
# [15.1.0](https://github.com/vuejs/vue-loader/compare/v15.0.12...v15.1.0) (2018-05-19)


### Performance Improvements

* avoid duplicate linting when used with eslint-loader ([3d07f81](https://github.com/vuejs/vue-loader/commit/3d07f81))



<a name="15.0.12"></a>
## [15.0.12](https://github.com/vuejs/vue-loader/compare/v15.0.11...v15.0.12) (2018-05-18)


### Bug Fixes

* ignore attrs that might interfere with query generation ([3a37269](https://github.com/vuejs/vue-loader/commit/3a37269)), closes [vuejs/vue-cli#1324](https://github.com/vuejs/vue-cli/issues/1324)



<a name="15.0.11"></a>
## [15.0.11](https://github.com/vuejs/vue-loader/compare/v15.0.9...v15.0.11) (2018-05-15)


### Bug Fixes

* improve HMR reliability ([4ccd96f](https://github.com/vuejs/vue-loader/commit/4ccd96f))



<a name="15.0.10"></a>
## [15.0.10](https://github.com/vuejs/vue-loader/compare/v15.0.9...v15.0.10) (2018-05-11)


### Bug Fixes

* improve HMR reliability ([52012cd](https://github.com/vuejs/vue-loader/commit/52012cd))



<a name="15.0.9"></a>
## [15.0.9](https://github.com/vuejs/vue-loader/compare/v15.0.8...v15.0.9) (2018-05-04)


### Bug Fixes

* shadowMode still has to be an option ([4529f83](https://github.com/vuejs/vue-loader/commit/4529f83))



<a name="15.0.8"></a>
## [15.0.8](https://github.com/vuejs/vue-loader/compare/v15.0.7...v15.0.8) (2018-05-04)


### Bug Fixes

* avoid mutating original rules array ([14bfc01](https://github.com/vuejs/vue-loader/commit/14bfc01)), closes [#1286](https://github.com/vuejs/vue-loader/issues/1286)



<a name="15.0.7"></a>
## [15.0.7](https://github.com/vuejs/vue-loader/compare/v15.0.6...v15.0.7) (2018-05-03)


### Bug Fixes

* stylePostLoader injection for windows flat node_modules ([a9a4412](https://github.com/vuejs/vue-loader/commit/a9a4412)), closes [#1284](https://github.com/vuejs/vue-loader/issues/1284)



<a name="15.0.6"></a>
## [15.0.6](https://github.com/vuejs/vue-loader/compare/v15.0.5...v15.0.6) (2018-05-02)


### Bug Fixes

* duplicate loaders when using src import with loader options ([37329e1](https://github.com/vuejs/vue-loader/commit/37329e1)), closes [#1278](https://github.com/vuejs/vue-loader/issues/1278)



<a name="15.0.5"></a>
## [15.0.5](https://github.com/vuejs/vue-loader/compare/v15.0.4...v15.0.5) (2018-04-30)


### Bug Fixes

* ignore VueLoaderPlugin check when using thread-loader ([#1268](https://github.com/vuejs/vue-loader/issues/1268)) ([476f466](https://github.com/vuejs/vue-loader/commit/476f466)), closes [#1267](https://github.com/vuejs/vue-loader/issues/1267)



<a name="15.0.4"></a>
## [15.0.4](https://github.com/vuejs/vue-loader/compare/v15.0.3...v15.0.4) (2018-04-27)


### Bug Fixes

* enable whitelist in exclude function ([5b0e392](https://github.com/vuejs/vue-loader/commit/5b0e392))



<a name="15.0.3"></a>
## [15.0.3](https://github.com/vuejs/vue-loader/compare/v15.0.2...v15.0.3) (2018-04-26)


### Bug Fixes

* handle rule.use being a string (ref: [#1256](https://github.com/vuejs/vue-loader/issues/1256)) ([fc2ba27](https://github.com/vuejs/vue-loader/commit/fc2ba27))



<a name="15.0.2"></a>
## [15.0.2](https://github.com/vuejs/vue-loader/compare/v15.0.1...v15.0.2) (2018-04-26)


### Bug Fixes

* remove resource field in cloned rules (fix [#1254](https://github.com/vuejs/vue-loader/issues/1254)) ([35ca03f](https://github.com/vuejs/vue-loader/commit/35ca03f))



<a name="15.0.1"></a>
## [15.0.1](https://github.com/vuejs/vue-loader/compare/v15.0.0...v15.0.1) (2018-04-25)


### Bug Fixes

* prioritize .vue rules in plugin (fix [#1246](https://github.com/vuejs/vue-loader/issues/1246)) ([bffacd5](https://github.com/vuejs/vue-loader/commit/bffacd5))
* warn missing plugin ([068bb81](https://github.com/vuejs/vue-loader/commit/068bb81))



<a name="15.0.0"></a>
# [15.0.0](https://github.com/vuejs/vue-loader/compare/v15.0.0-rc.2...v15.0.0) (2018-04-24)


### Bug Fixes

* compat with null-loader (close [#1239](https://github.com/vuejs/vue-loader/issues/1239)) ([5cd5f6f](https://github.com/vuejs/vue-loader/commit/5cd5f6f))


### Features

* support declaring rules using .vue.html (ref [#1238](https://github.com/vuejs/vue-loader/issues/1238)) ([a3af6b3](https://github.com/vuejs/vue-loader/commit/a3af6b3))



<a name="15.0.0-rc.2"></a>
# [15.0.0-rc.2](https://github.com/vuejs/vue-loader/compare/v15.0.0-rc.1...v15.0.0-rc.2) (2018-04-11)


### Bug Fixes

* avoid bailout of webpack module concatenation ([#1230](https://github.com/vuejs/vue-loader/issues/1230)) ([b983304](https://github.com/vuejs/vue-loader/commit/b983304))
* reuse ident of css related loaders to avoid duplicates ([#1233](https://github.com/vuejs/vue-loader/issues/1233)) ([b16311f](https://github.com/vuejs/vue-loader/commit/b16311f))



<a name="15.0.0-rc.1"></a>
# [15.0.0-rc.1](https://github.com/vuejs/vue-loader/compare/v15.0.0-beta.7...v15.0.0-rc.1) (2018-04-06)


### Features

* support being used on files not ending with .vue ([5a9ee91](https://github.com/vuejs/vue-loader/commit/5a9ee91))



<a name="15.0.0-beta.7"></a>
# [15.0.0-beta.7](https://github.com/vuejs/vue-loader/compare/v15.0.0-beta.6...v15.0.0-beta.7) (2018-03-25)


### Features

* handle `<template lang="xxx">` with loaders ([c954f32](https://github.com/vuejs/vue-loader/commit/c954f32))


### BREAKING CHANGES

* `<template lang="xxx">` are now handled
with webpack loaders as well.



<a name="15.0.0-beta.6"></a>
# [15.0.0-beta.6](https://github.com/vuejs/vue-loader/compare/v15.0.0-beta.5...v15.0.0-beta.6) (2018-03-24)


### Bug Fixes

* compat with html-webpack-plugin ([8626739](https://github.com/vuejs/vue-loader/commit/8626739)), closes [#1213](https://github.com/vuejs/vue-loader/issues/1213)
* only reuse ident for whitelisted loaders ([230abd4](https://github.com/vuejs/vue-loader/commit/230abd4)), closes [#1214](https://github.com/vuejs/vue-loader/issues/1214)



<a name="15.0.0-beta.5"></a>
# [15.0.0-beta.5](https://github.com/vuejs/vue-loader/compare/v15.0.0-beta.4...v15.0.0-beta.5) (2018-03-23)


### Bug Fixes

* pass correct args to RuleSet.normalizeRule (fix [#1210](https://github.com/vuejs/vue-loader/issues/1210)) ([1c54dc4](https://github.com/vuejs/vue-loader/commit/1c54dc4))



<a name="15.0.0-beta.4"></a>
# [15.0.0-beta.4](https://github.com/vuejs/vue-loader/compare/v15.0.0-beta.3...v15.0.0-beta.4) (2018-03-23)


### Bug Fixes

* avoid babel options validation error (fix [#1209](https://github.com/vuejs/vue-loader/issues/1209)) ([d3e3f5e](https://github.com/vuejs/vue-loader/commit/d3e3f5e))



<a name="15.0.0-beta.3"></a>
# [15.0.0-beta.3](https://github.com/vuejs/vue-loader/compare/v15.0.0-beta.2...v15.0.0-beta.3) (2018-03-23)


### Bug Fixes

* handle vue rule with include (fix [#1201](https://github.com/vuejs/vue-loader/issues/1201)) ([2be5507](https://github.com/vuejs/vue-loader/commit/2be5507))
* make sure cloned rules reuse the exact same ident in options ([eab9460](https://github.com/vuejs/vue-loader/commit/eab9460)), closes [#1199](https://github.com/vuejs/vue-loader/issues/1199)
* remove rule.loaders from normalized rules ([#1207](https://github.com/vuejs/vue-loader/issues/1207)) ([e9cbbcd](https://github.com/vuejs/vue-loader/commit/e9cbbcd))
* support test-less oneOf rules ([7208885](https://github.com/vuejs/vue-loader/commit/7208885))
* use relative path for self path resolution ([343b9df](https://github.com/vuejs/vue-loader/commit/343b9df))


### Features

* **loader:** support options.productionMode ([#1208](https://github.com/vuejs/vue-loader/issues/1208)) ([69bc1c1](https://github.com/vuejs/vue-loader/commit/69bc1c1))



<a name="15.0.0-beta.2"></a>
# [15.0.0-beta.2](https://github.com/vuejs/vue-loader/compare/v15.0.0-beta.1...v15.0.0-beta.2) (2018-03-22)


### Bug Fixes

* loader check for windows ([ab067b0](https://github.com/vuejs/vue-loader/commit/ab067b0))
* properly stringify hot-reload-api path for Windows ([fb1306e](https://github.com/vuejs/vue-loader/commit/fb1306e))



<a name="15.0.0-beta.1"></a>
# [15.0.0-beta.1](https://github.com/vuejs/vue-loader/compare/f418bd9...v15.0.0-beta.1) (2018-03-21)


### Bug Fixes

* remove .vue from fake resourcePath to avoid double match ([7c5b6ac](https://github.com/vuejs/vue-loader/commit/7c5b6ac))


### Features

* basic hot reload ([f418bd9](https://github.com/vuejs/vue-loader/commit/f418bd9))
* css modules + hmr ([99754c0](https://github.com/vuejs/vue-loader/commit/99754c0))
* dynamic style injection ([234d48b](https://github.com/vuejs/vue-loader/commit/234d48b))
* expose all block attrs via query ([cda1ec3](https://github.com/vuejs/vue-loader/commit/cda1ec3))
* respect user compiler / compilerOptions ([58239f6](https://github.com/vuejs/vue-loader/commit/58239f6))
* support configuring loader for custom blocks via resourceQuery ([d04f9cf](https://github.com/vuejs/vue-loader/commit/d04f9cf))
* support rules with oneOf ([c3b379d](https://github.com/vuejs/vue-loader/commit/c3b379d))



