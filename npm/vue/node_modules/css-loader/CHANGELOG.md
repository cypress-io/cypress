# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.4.2](https://github.com/webpack-contrib/css-loader/compare/v3.4.1...v3.4.2) (2020-01-10)


### Bug Fixes

* do not duplicate css on `composes` ([#1040](https://github.com/webpack-contrib/css-loader/issues/1040)) ([df79602](https://github.com/webpack-contrib/css-loader/commit/df7960277be20ec80e9be1a41ac53baf69847fa0))

### [3.4.1](https://github.com/webpack-contrib/css-loader/compare/v3.4.0...v3.4.1) (2020-01-03)


### Bug Fixes

* do not output `undefined` when sourceRoot is unavailable ([#1036](https://github.com/webpack-contrib/css-loader/issues/1036)) ([ded2a79](https://github.com/webpack-contrib/css-loader/commit/ded2a797271f2adf864bf92300621c024974bc79))
* don't output invalid es5 code when locals do not exists ([#1035](https://github.com/webpack-contrib/css-loader/issues/1035)) ([b60e62a](https://github.com/webpack-contrib/css-loader/commit/b60e62a655719cc1779fae7d577af6ad6cf42135))

## [3.4.0](https://github.com/webpack-contrib/css-loader/compare/v3.3.1...v3.4.0) (2019-12-17)


### Features

* `esModule` option ([#1026](https://github.com/webpack-contrib/css-loader/issues/1026)) ([d358cdb](https://github.com/webpack-contrib/css-loader/commit/d358cdbe2c026afafa0279003cb6c8a3eff4c419))


### Bug Fixes

* logic for order and media queries for imports ([#1018](https://github.com/webpack-contrib/css-loader/issues/1018)) ([65450d9](https://github.com/webpack-contrib/css-loader/commit/65450d9c04790ccc9fb06eac81ea6d8f3cdbfaac))

### [3.3.2](https://github.com/webpack-contrib/css-loader/compare/v3.3.1...v3.3.2) (2019-12-12)


### Bug Fixes

* logic for order and media queries for imports ([1fb5134](https://github.com/webpack-contrib/css-loader/commit/1fb51340a7719b6f5b517cb71ea85ec5d45c1199))

### [3.3.1](https://github.com/webpack-contrib/css-loader/compare/v3.3.0...v3.3.1) (2019-12-12)


### Bug Fixes

* better handling url functions and an url in `@import` at-rules
* reduce count of `require` ([#1014](https://github.com/webpack-contrib/css-loader/issues/1014)) ([e091d27](https://github.com/webpack-contrib/css-loader/commit/e091d2709c29ac57ed0106af8ec3b581cbda7a9c))

## [3.3.0](https://github.com/webpack-contrib/css-loader/compare/v3.2.1...v3.3.0) (2019-12-09)


### Features

* support `pure` css modules ([#1008](https://github.com/webpack-contrib/css-loader/issues/1008)) ([6177af5](https://github.com/webpack-contrib/css-loader/commit/6177af5596566fead13a8f66d5abcb4dc2b744db))


### Bug Fixes

* do not crash when an assert return `null` or `undefined` ([#1006](https://github.com/webpack-contrib/css-loader/issues/1006)) ([6769783](https://github.com/webpack-contrib/css-loader/commit/67697833725e1cff12a14663390bbe4c65ea36d2))
* reduce count of `require` ([#1004](https://github.com/webpack-contrib/css-loader/issues/1004)) ([80e9662](https://github.com/webpack-contrib/css-loader/commit/80e966280f2477c5c0e4553d3be3a04511fea381))

### [3.2.1](https://github.com/webpack-contrib/css-loader/compare/v3.2.0...v3.2.1) (2019-12-02)


### Bug Fixes

* add an additional space after the escape sequence ([#998](https://github.com/webpack-contrib/css-loader/issues/998)) ([0961304](https://github.com/webpack-contrib/css-loader/commit/0961304020832fc9ca70cc708f4366e1f868e765))
* compatibility with ES modules syntax and hash in `url` function ([#1001](https://github.com/webpack-contrib/css-loader/issues/1001)) ([8f4d6f5](https://github.com/webpack-contrib/css-loader/commit/8f4d6f508187513347106a436eda993f874065f1))

## [3.2.0](https://github.com/webpack-contrib/css-loader/compare/v3.1.0...v3.2.0) (2019-08-06)


### Bug Fixes

* replace `.` characters in localIndent to `-` character (regression) ([#982](https://github.com/webpack-contrib/css-loader/issues/982)) ([967fb66](https://github.com/webpack-contrib/css-loader/commit/967fb66))


### Features

* support es modules for assets loader ([#984](https://github.com/webpack-contrib/css-loader/issues/984)) ([9c5126c](https://github.com/webpack-contrib/css-loader/commit/9c5126c))

## [3.1.0](https://github.com/webpack-contrib/css-loader/compare/v3.0.0...v3.1.0) (2019-07-18)


### Bug Fixes

* converting all (including reserved and control) filesystem characters to `-` (it was regression in `3.0.0` version) ([#972](https://github.com/webpack-contrib/css-loader/issues/972)) ([f51859b](https://github.com/webpack-contrib/css-loader/commit/f51859b))
* default context should be undefined instead of null ([#965](https://github.com/webpack-contrib/css-loader/issues/965)) ([9c32885](https://github.com/webpack-contrib/css-loader/commit/9c32885))


### Features

* allow `modules.getLocalIdent` to return a falsy value ([#963](https://github.com/webpack-contrib/css-loader/issues/963)) ([9c3571c](https://github.com/webpack-contrib/css-loader/commit/9c3571c))
* improved validation error messages ([65e4fc0](https://github.com/webpack-contrib/css-loader/commit/65e4fc0))



## [3.0.0](https://github.com/webpack-contrib/css-loader/compare/v2.1.1...v3.0.0) (2019-06-11)


### Bug Fixes

* avoid the "from" argument must be of type string error ([#908](https://github.com/webpack-contrib/css-loader/issues/908)) ([e5dfd23](https://github.com/webpack-contrib/css-loader/commit/e5dfd23))
* invert `Function` behavior for `url` and `import` options ([#939](https://github.com/webpack-contrib/css-loader/issues/939)) ([e9eb5ad](https://github.com/webpack-contrib/css-loader/commit/e9eb5ad))
* properly export locals with escaped characters ([#917](https://github.com/webpack-contrib/css-loader/issues/917)) ([a0efcda](https://github.com/webpack-contrib/css-loader/commit/a0efcda))
* property handle non css characters in localIdentName ([#920](https://github.com/webpack-contrib/css-loader/issues/920)) ([d3a0a3c](https://github.com/webpack-contrib/css-loader/commit/d3a0a3c))


### Features

* modules options now accepts object config ([#937](https://github.com/webpack-contrib/css-loader/issues/937)) ([1d7a464](https://github.com/webpack-contrib/css-loader/commit/1d7a464))
* support `@value` at-rule in selectors ([#941](https://github.com/webpack-contrib/css-loader/issues/941)) ([05a42e2](https://github.com/webpack-contrib/css-loader/commit/05a42e2))


### BREAKING CHANGES

* minimum required nodejs version is 8.9.0
* `@value` at rules now support in `selector`, recommends checking all `@values` at-rule usage (hint: you can add prefix to all `@value` at-rules, for example `@value v-foo: black;` or `@value m-foo: screen and (max-width: 12450px)`, and then do upgrade)
* invert `{Function}` behavior for `url` and `import` options  (need return `true` when you want handle `url`/`@import` and return `false` if not)
* `camelCase` option was remove in favor `localsConvention` option, also it is accept only `{String}` value (use `camelCase` value if you previously value was `true` and `asIs` if you previously value was `false`)
* `exportOnlyLocals` option was remove in favor `onlyLocals` option
* `modules` option now can be `{Object}` and allow to setup `CSS Modules` options:
  * `localIdentName` option was removed in favor `modules.localIdentName` option
  * `context` option was remove in favor `modules.context` option
  * `hashPrefix` option was removed in favor `modules.hashPrefix` option
  * `getLocalIdent` option was removed in favor `modules.getLocalIdent` option
  * `localIdentRegExp` option was removed in favor `modules.localIdentRegExp` option



<a name="2.1.1"></a>
## [2.1.1](https://github.com/webpack-contrib/css-loader/compare/v2.1.0...v2.1.1) (2019-03-07)


### Bug Fixes

* do not break selector with escaping ([#896](https://github.com/webpack-contrib/css-loader/issues/896)) ([0ba8c66](https://github.com/webpack-contrib/css-loader/commit/0ba8c66))
* source map generation when `sourceRoot` is present ([#901](https://github.com/webpack-contrib/css-loader/issues/901)) ([e9ce745](https://github.com/webpack-contrib/css-loader/commit/e9ce745))
* sourcemap generating when previous loader pass sourcemap as string ([#905](https://github.com/webpack-contrib/css-loader/issues/905)) ([3797e4d](https://github.com/webpack-contrib/css-loader/commit/3797e4d))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/webpack-contrib/css-loader/compare/v2.0.2...v2.1.0) (2018-12-25)


### Features

* support `image-set` without `url` ([#879](https://github.com/webpack-contrib/css-loader/issues/879)) ([21884e2](https://github.com/webpack-contrib/css-loader/commit/21884e2))



<a name="2.0.2"></a>
## [2.0.2](https://github.com/webpack-contrib/css-loader/compare/v2.0.1...v2.0.2) (2018-12-21)


### Bug Fixes

* inappropriate modification of animation keywords ([#876](https://github.com/webpack-contrib/css-loader/issues/876)) ([dfb2f8e](https://github.com/webpack-contrib/css-loader/commit/dfb2f8e))



<a name="2.0.1"></a>
# [2.0.1](https://github.com/webpack-contrib/css-loader/compare/v2.0.0...v2.0.1) (2018-12-14)


### Bug Fixes

* safe checking if params are present for at rule ([#871](https://github.com/webpack-contrib/css-loader/issues/871)) ([a88fed1](https://github.com/webpack-contrib/css-loader/commit/a88fed1))
* `getLocalIdent` now accepts `false` value ([#865](https://github.com/webpack-contrib/css-loader/issues/865)) ([1825e8a](https://github.com/webpack-contrib/css-loader/commit/1825e8a))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/webpack-contrib/css-loader/compare/v1.0.1...v2.0.0) (2018-12-07)


### Bug Fixes

* broken unucode characters ([#850](https://github.com/webpack-contrib/css-loader/issues/850)) ([f599c70](https://github.com/webpack-contrib/css-loader/commit/f599c70))
* correctly processing `urls()` with `?#hash` ([#803](https://github.com/webpack-contrib/css-loader/issues/803)) ([417d105](https://github.com/webpack-contrib/css-loader/commit/417d105))
* don't break loader on invalid or not exists url or import token ([#827](https://github.com/webpack-contrib/css-loader/issues/827)) ([9e52d26](https://github.com/webpack-contrib/css-loader/commit/9e52d26))
* don't duplicate import with same media in different case ([#819](https://github.com/webpack-contrib/css-loader/issues/819)) ([9f66e33](https://github.com/webpack-contrib/css-loader/commit/9f66e33))
* emit warnings on broken `import` at-rules ([#806](https://github.com/webpack-contrib/css-loader/issues/806)) ([4bdf08b](https://github.com/webpack-contrib/css-loader/commit/4bdf08b))
* handle uppercase `URL` in `import` at-rules ([#818](https://github.com/webpack-contrib/css-loader/issues/818)) ([3ebdcd5](https://github.com/webpack-contrib/css-loader/commit/3ebdcd5))
* inconsistent generate class names for css modules on difference os ([#812](https://github.com/webpack-contrib/css-loader/issues/812)) ([0bdf9b7](https://github.com/webpack-contrib/css-loader/commit/0bdf9b7))
* reduce number of `require` for `urls()` ([#854](https://github.com/webpack-contrib/css-loader/issues/854)) ([3338656](https://github.com/webpack-contrib/css-loader/commit/3338656))
* support deduplication of string module ids (optimization.namedModules) ([#789](https://github.com/webpack-contrib/css-loader/issues/789)) ([e3bb83a](https://github.com/webpack-contrib/css-loader/commit/e3bb83a))
* support module resolution in `composes` ([#845](https://github.com/webpack-contrib/css-loader/issues/845)) ([453248f](https://github.com/webpack-contrib/css-loader/commit/453248f))
* same `urls()` resolving logic for `modules` (`local` and `global`) and without modules ([#843](https://github.com/webpack-contrib/css-loader/issues/843)) ([fdcf687](https://github.com/webpack-contrib/css-loader/commit/fdcf687))

### Features

* allow to disable css modules and **disable their by default** ([#842](https://github.com/webpack-contrib/css-loader/issues/842)) ([889dc7f](https://github.com/webpack-contrib/css-loader/commit/889dc7f))
* disable `import` option doesn't affect on `composes` ([#822](https://github.com/webpack-contrib/css-loader/issues/822)) ([f9aa73c](https://github.com/webpack-contrib/css-loader/commit/f9aa73c))
* allow to filter `urls` ([#856](https://github.com/webpack-contrib/css-loader/issues/856)) ([5e702e7](https://github.com/webpack-contrib/css-loader/commit/5e702e7))
* allow to filter `import` at-rules ([#857](https://github.com/webpack-contrib/css-loader/issues/857)) ([5e6034c](https://github.com/webpack-contrib/css-loader/commit/5e6034c))
* emit warning on invalid `urls()` ([#832](https://github.com/webpack-contrib/css-loader/issues/832)) ([da95db8](https://github.com/webpack-contrib/css-loader/commit/da95db8))
* added `exportOnlyLocals` option ([#824](https://github.com/webpack-contrib/css-loader/issues/824)) ([e9327c0](https://github.com/webpack-contrib/css-loader/commit/e9327c0))
* reuse `postcss` ast from other loaders (i.e `postcss-loader`) ([#840](https://github.com/webpack-contrib/css-loader/issues/840)) ([1dad1fb](https://github.com/webpack-contrib/css-loader/commit/1dad1fb))
* schema options ([b97d997](https://github.com/webpack-contrib/css-loader/commit/b97d997))


### BREAKING CHANGES

* resolving logic for `url()` and `import` at-rules works the same everywhere, it does not matter whether css modules are enabled (with `global` and `local` module) or not. Examples - `url('image.png')` as `require('./image.png')`, `url('./image.png')` as `require('./image.png')`, `url('~module/image.png')` as `require('module/image.png')`.
* by default css modules are disabled (now `modules: false` disable all css modules features), you can return old behaviour change this on `modules: 'global'`
* `css-loader/locals` was dropped in favor `exportOnlyLocals` option
* `import` option only affect on `import` at-rules and doesn't affect on `composes` declarations
* invalid `@import` at rules now emit warnings
* use `postcss@7`



<a name="1.0.1"></a>
## [1.0.1](https://github.com/webpack-contrib/css-loader/compare/v1.0.0...v1.0.1) (2018-10-29)


### Bug Fixes

* **loader:** trim unquoted import urls ([#783](https://github.com/webpack-contrib/css-loader/issues/783)) ([21fcddf](https://github.com/webpack-contrib/css-loader/commit/21fcddf))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/webpack-contrib/css-loader/compare/v0.28.11...v1.0.0) (2018-07-06)


### BREAKING CHANGES

* remove `minimize` option, use [`postcss-loader`](https://github.com/postcss/postcss-loader) with [`cssnano`](https://github.com/cssnano/cssnano) or use [`optimize-cssnano-plugin`](https://github.com/intervolga/optimize-cssnano-plugin) plugin
* remove `module` option, use `modules` option instead
* remove `camelcase` option, use `camelCase` option instead
* remove `root` option, use [`postcss-loader`](https://github.com/postcss/postcss-loader) with [`postcss-url`](https://github.com/postcss/postcss-url) plugin
* remove `alias` option, use [`resolve.alias`](https://webpack.js.org/configuration/resolve/) feature or use [`postcss-loader`](https://github.com/postcss/postcss-loader) with [`postcss-url`](https://github.com/postcss/postcss-url) plugin
* update `postcss` to `6` version
* minimum require `nodejs` version is `6.9`
* minimum require `webpack` version is `4`



<a name="0.28.11"></a>
## [0.28.11](https://github.com/webpack-contrib/css-loader/compare/v0.28.10...v0.28.11) (2018-03-16)


### Bug Fixes

* **lib/processCss:** don't check `mode` for `url` handling (`options.modules`) ([#698](https://github.com/webpack-contrib/css-loader/issues/698)) ([c788450](https://github.com/webpack-contrib/css-loader/commit/c788450))



<a name="0.28.10"></a>
## [0.28.10](https://github.com/webpack-contrib/css-loader/compare/v0.28.9...v0.28.10) (2018-02-22)


### Bug Fixes

* **getLocalIdent:** add `rootContext` support (`webpack >= v4.0.0`) ([#681](https://github.com/webpack-contrib/css-loader/issues/681)) ([9f876d2](https://github.com/webpack-contrib/css-loader/commit/9f876d2))



<a name="0.28.9"></a>
## [0.28.9](https://github.com/webpack-contrib/css-loader/compare/v0.28.8...v0.28.9) (2018-01-17)


### Bug Fixes

* ignore invalid URLs (`url()`) ([#663](https://github.com/webpack-contrib/css-loader/issues/663)) ([d1d8221](https://github.com/webpack-contrib/css-loader/commit/d1d8221))



<a name="0.28.8"></a>
## [0.28.8](https://github.com/webpack-contrib/css-loader/compare/v0.28.7...v0.28.8) (2018-01-05)


### Bug Fixes

* **loader:** correctly check if source map is `undefined` ([#641](https://github.com/webpack-contrib/css-loader/issues/641)) ([0dccfa9](https://github.com/webpack-contrib/css-loader/commit/0dccfa9))
* proper URL escaping and wrapping (`url()`) ([#627](https://github.com/webpack-contrib/css-loader/issues/627)) ([8897d44](https://github.com/webpack-contrib/css-loader/commit/8897d44))



<a name="0.28.7"></a>
## [0.28.7](https://github.com/webpack/css-loader/compare/v0.28.6...v0.28.7) (2017-08-30)


### Bug Fixes

* pass resolver to `localsLoader` (`options.alias`)  ([#601](https://github.com/webpack/css-loader/issues/601)) ([8f1b57c](https://github.com/webpack/css-loader/commit/8f1b57c))



<a name="0.28.6"></a>
## [0.28.6](https://github.com/webpack/css-loader/compare/v0.28.5...v0.28.6) (2017-08-30)


### Bug Fixes

* add support for aliases starting with `/` (`options.alias`) ([#597](https://github.com/webpack/css-loader/issues/597)) ([63567f2](https://github.com/webpack/css-loader/commit/63567f2))



<a name="0.28.5"></a>
## [0.28.5](https://github.com/webpack/css-loader/compare/v0.28.4...v0.28.5) (2017-08-17)


### Bug Fixes

* match mutliple dashes (`options.camelCase`) ([#556](https://github.com/webpack/css-loader/issues/556)) ([1fee601](https://github.com/webpack/css-loader/commit/1fee601))
* stricter `[@import](https://github.com/import)` tolerance ([#593](https://github.com/webpack/css-loader/issues/593)) ([2e4ec09](https://github.com/webpack/css-loader/commit/2e4ec09))



<a name="0.28.4"></a>
## [0.28.4](https://github.com/webpack/css-loader/compare/v0.28.3...v0.28.4) (2017-05-30)


### Bug Fixes

* preserve leading underscore in class names ([#543](https://github.com/webpack/css-loader/issues/543)) ([f6673c8](https://github.com/webpack/css-loader/commit/f6673c8))



<a name="0.28.3"></a>
## [0.28.3](https://github.com/webpack/css-loader/compare/v0.28.2...v0.28.3) (2017-05-25)


### Bug Fixes

* correct plugin order for CSS Modules ([#534](https://github.com/webpack/css-loader/issues/534)) ([b90f492](https://github.com/webpack/css-loader/commit/b90f492))



<a name="0.28.2"></a>
## [0.28.2](https://github.com/webpack/css-loader/compare/v0.28.1...v0.28.2) (2017-05-22)


### Bug Fixes

* source maps path on `windows` ([#532](https://github.com/webpack/css-loader/issues/532)) ([c3d0d91](https://github.com/webpack/css-loader/commit/c3d0d91))



<a name="0.28.1"></a>
## [0.28.1](https://github.com/webpack/css-loader/compare/v0.28.0...v0.28.1) (2017-05-02)


### Bug Fixes

* allow to specify a full hostname as a root URL ([#521](https://github.com/webpack/css-loader/issues/521)) ([06d27a1](https://github.com/webpack/css-loader/commit/06d27a1))
* case insensitivity of [@import](https://github.com/import) ([#514](https://github.com/webpack/css-loader/issues/514)) ([de4356b](https://github.com/webpack/css-loader/commit/de4356b))
* don't handle empty [@import](https://github.com/import) and url() ([#513](https://github.com/webpack/css-loader/issues/513)) ([868fc94](https://github.com/webpack/css-loader/commit/868fc94))
* imported variables are replaced in exports if followed by a comma ([#504](https://github.com/webpack/css-loader/issues/504)) ([956bad7](https://github.com/webpack/css-loader/commit/956bad7))
* loader now correctly handles `url` with space(s) ([#495](https://github.com/webpack/css-loader/issues/495)) ([534ea55](https://github.com/webpack/css-loader/commit/534ea55))
* url with a trailing space is now handled correctly ([#494](https://github.com/webpack/css-loader/issues/494)) ([e1ec4f2](https://github.com/webpack/css-loader/commit/e1ec4f2))
* use `btoa` instead `Buffer` ([#501](https://github.com/webpack/css-loader/issues/501)) ([fbb0714](https://github.com/webpack/css-loader/commit/fbb0714))


### Performance Improvements

* generate source maps only when explicitly set ([#478](https://github.com/webpack/css-loader/issues/478)) ([b8f5c8f](https://github.com/webpack/css-loader/commit/b8f5c8f))



<a name="0.28.0"></a>
# [0.28.0](https://github.com/webpack/css-loader/compare/v0.27.3...v0.28.0) (2017-03-30)


### Features

* add alias feature to rewrite URLs ([#274](https://github.com/webpack/css-loader/issues/274)) ([c8db489](https://github.com/webpack/css-loader/commit/c8db489))



<a name="0.27.3"></a>
## [0.27.3](https://github.com/webpack/css-loader/compare/v0.27.2...v0.27.3) (2017-03-13)



<a name="0.27.2"></a>
# [0.27.2](https://github.com/webpack/css-loader/compare/v0.27.1...v0.27.2) (2017-03-12)

<a name="0.27.1"></a>
# [0.27.1](https://github.com/webpack/css-loader/compare/v0.27.0...v0.27.1) (2017-03-10)

<a name="0.27.0"></a>
# [0.27.0](https://github.com/webpack/css-loader/compare/v0.26.2...v0.27.0) (2017-03-10)


### Bug Fixes

* **sourcemaps:** use abs paths & remove sourceRoot ([c769ac3](https://github.com/webpack/css-loader/commit/c769ac3))
* `minimizeOptions` should be `query.minimize`! ([16c0858](https://github.com/webpack/css-loader/commit/16c0858))
* do not export duplicate keys ([#420](https://github.com/webpack/css-loader/issues/420)) ([a2b85d7](https://github.com/webpack/css-loader/commit/a2b85d7))


### Features

* allow removal of original class name ([#445](https://github.com/webpack/css-loader/issues/445)) ([3f78361](https://github.com/webpack/css-loader/commit/3f78361))
* Include the sourceMappingURL & sourceURL when toString() ([6da7e90](https://github.com/webpack/css-loader/commit/6da7e90))
