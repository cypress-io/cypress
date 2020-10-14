# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="3.2.0"></a>
# [3.2.0](https://github.com/jantimon/html-webpack-plugin/compare/v3.1.0...v3.2.0) (2018-04-03)


### Bug Fixes

* **loader:** Allow to add new template parameters ([f7eac19](https://github.com/jantimon/html-webpack-plugin/commit/f7eac19)), closes [#915](https://github.com/jantimon/html-webpack-plugin/issues/915)
* **loader:** Use lodash inside the loader directly ([7b4eb7f](https://github.com/jantimon/html-webpack-plugin/commit/7b4eb7f)), closes [#786](https://github.com/jantimon/html-webpack-plugin/issues/786)


### Features

* Add meta tag option ([a7d37ca](https://github.com/jantimon/html-webpack-plugin/commit/a7d37ca))
* Support node 6.9 ([74a22c4](https://github.com/jantimon/html-webpack-plugin/commit/74a22c4)), closes [#918](https://github.com/jantimon/html-webpack-plugin/issues/918)



<a name="3.1.0"></a>
# [3.1.0](https://github.com/jantimon/html-webpack-plugin/compare/v3.0.8...v3.1.0) (2018-03-22)


### Features

* Allow to overwrite the templateParameter [#830](https://github.com/jantimon/html-webpack-plugin/issues/830) ([c5e32d3](https://github.com/jantimon/html-webpack-plugin/commit/c5e32d3))



<a name="3.0.8"></a>
## [3.0.8](https://github.com/jantimon/html-webpack-plugin/compare/v3.0.7...v3.0.8) (2018-03-22)


### Bug Fixes

* **compiler:** Fallback to 3.0.7 because of [#900](https://github.com/jantimon/html-webpack-plugin/issues/900) ([05ee29b](https://github.com/jantimon/html-webpack-plugin/commit/05ee29b))



<a name="3.0.7"></a>
## [3.0.7](https://github.com/jantimon/html-webpack-plugin/compare/v3.0.6...v3.0.7) (2018-03-19)


### Bug Fixes

* **compiler:** Set single entry name [#895](https://github.com/jantimon/html-webpack-plugin/issues/895) ([26dcb98](https://github.com/jantimon/html-webpack-plugin/commit/26dcb98))



<a name="3.0.6"></a>
## [3.0.6](https://github.com/jantimon/html-webpack-plugin/compare/v3.0.5...v3.0.6) (2018-03-06)


### Bug Fixes

* **hooks:** Call tapable.apply directly [#879](https://github.com/jantimon/html-webpack-plugin/issues/879) ([bcbb036](https://github.com/jantimon/html-webpack-plugin/commit/bcbb036))



<a name="3.0.5"></a>
## [3.0.5](https://github.com/jantimon/html-webpack-plugin/compare/v3.0.2...v3.0.5) (2018-03-06)


### Bug Fixes

* **entries:** do not ignore JS if there is also CSS ([020b714](https://github.com/jantimon/html-webpack-plugin/commit/020b714))
* **entries:** Don't add css entries twice ([0348d6b](https://github.com/jantimon/html-webpack-plugin/commit/0348d6b))
* **hooks:** Remove deprecated tapable calls [#879](https://github.com/jantimon/html-webpack-plugin/issues/879) ([2288f20](https://github.com/jantimon/html-webpack-plugin/commit/2288f20))



<a name="3.0.4"></a>
## [3.0.4](https://github.com/jantimon/html-webpack-plugin/compare/v3.0.2...v3.0.4) (2018-03-01)


### Bug Fixes

* **entries:** Don't add css entries twice ([e890f23](https://github.com/jantimon/html-webpack-plugin/commit/e890f23))



<a name="3.0.3"></a>
## [3.0.3](https://github.com/jantimon/html-webpack-plugin/compare/v3.0.2...v3.0.3) (2018-03-01)


### Refactor

* **performance:** Reduce the amount of chunk information gathered based on #825 ([06c59a7](https://github.com/jantimon/html-webpack-plugin/commit/06c59a7))


<a name="3.0.2"></a>
## [3.0.2](https://github.com/jantimon/html-webpack-plugin/compare/v3.0.1...v3.0.2) (2018-03-01)


### Bug Fixes

* **query-loader:** In case no query is provided, return an empty object. This fixes #727 ([7587754](https://github.com/jantimon/html-webpack-plugin/commit/7587754))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/jantimon/html-webpack-plugin/compare/v3.0.0...v3.0.1) (2018-03-01)


### Bug Fixes

* **package:** Remove the extract-text-webpack-plugin peer dependency ([57411a9](https://github.com/jantimon/html-webpack-plugin/commit/57411a9))

<a name="3.0.0"></a>
## [3.0.0](https://github.com/jantimon/html-webpack-plugin/compare/v2.30.1...v3.0.0) (2018-28-02)

### Features

* Add support for the new [webpack tapable](https://github.com/webpack/tapable) to be compatible with webpack 4.x
* Remove bluebird dependency

### BREAKING CHANGES

* Similar to webpack 4.x the support for node versions older than 6 are no longer supported

<a name="2.30.1"></a>
## 2.30.1

* Revert part the performance optimization ([#723](https://github.com/jantimon/html-webpack-plugin/pull/723)) because of [#753](https://github.com/jantimon/html-webpack-plugin/issues/753).

<a name="2.30.0"></a>
## 2.30.0

* Add manual sort
* Performance improvements ([#723](https://github.com/jantimon/html-webpack-plugin/pull/723))

<a name="2.29.0"></a>
## 2.29.0

* Add support for Webpack 3

<a name="2.28.0"></a>
## 2.28.0

* Backport 3.x void tag for plugin authors

<a name="2.27.1"></a>
## 2.27.1

* Revert 2.25.0 loader resolving

<a name="2.27.0"></a>
## 2.27.0

* Fix a chunksorter webpack 2 issue ([#569](https://github.com/jantimon/html-webpack-plugin/pull/569))
* Fix template path resolving ([#542](https://github.com/jantimon/html-webpack-plugin/pull/542))

<a name="2.26.0"></a>
## 2.26.0

* Allow plugins to add attributes without values to the `<script>` and `<link>` tags

<a name="2.25.0"></a>
## 2.25.0

* Clearer loader output
* Add basic support for webpack 2

<a name="2.24.1"></a>
## 2.24.1

* Hide event deprecated warning of 'applyPluginsAsyncWaterfall' for html-webpack-plugin-after-emit and improve the warning message.

<a name="2.24.0"></a>
## 2.24.0

* Update dependencies
* Add deprecate warning for plugins not returning a result
* Add [path] for favicons

<a name="2.23.0"></a>
## 2.23.0

* Update dependencies
* Stop automated tests for webpack 2 beta because of [#401](https://github.com/jantimon/html-webpack-plugin/issues/401)

<a name="2.22.0"></a>
## 2.22.0

* Update dependencies

<a name="2.21.1"></a>
## 2.21.1

* Better error handling ([#354](https://github.com/jantimon/html-webpack-plugin/pull/354))

<a name="2.21.0"></a>
## 2.21.0

* Add `html-webpack-plugin-alter-asset-tags` event to allow plugins to adjust the script/link tags

<a name="2.20.0"></a>
## 2.20.0

* Exclude chunks works now even if combined with dependency sort

<a name="2.19.0"></a>
## 2.19.0

* Add `html-webpack-plugin-alter-chunks` event for custom chunk sorting and interpolation

<a name="2.18.0"></a>
## 2.18.0

* Updated all dependencies

<a name="2.17.0"></a>
## 2.17.0

* Add `type` attribute to `script` element to prevent issues in Safari 9.1.1

<a name="2.16.2"></a>
## 2.16.2

* Fix bug introduced by 2.16.2. Fixes  [#315](https://github.com/jantimon/html-webpack-plugin/issues/315)

<a name="2.16.1"></a>
## 2.16.1

* Fix hot module replacement for webpack 2.x

<a name="2.16.0"></a>
## 2.16.0

* Add support for dynamic filenames like index[hash].html

<a name="2.15.0"></a>
## 2.15.0

* Add full unit test coverage for the webpack 2 beta version
* For webpack 2 the default sort will be 'dependency' instead of 'id'
* Upgrade dependencies

<a name="2.14.0"></a>
## 2.14.0

* Export publicPath to the template
* Add example for inlining css and js

<a name="2.13.0"></a>
## 2.13.0

* Add support for absolute output file names
* Add support for relative file names outside the output path

<a name="2.12.0"></a>
## 2.12.0

* Basic Webpack 2.x support #225

<a name="2.11.0"></a>
## 2.11.0

* Add `xhtml` option which is turned of by default. When activated it will inject self closed `<link href=".." />` tags instead of unclosed `<link href="..">` tags. ([#255](https://github.com/ampedandwired/html-webpack-plugin/pull/255))
* Add support for webpack placeholders inside the public path e.g. `'/dist/[hash]/'`. ([#249](https://github.com/ampedandwired/html-webpack-plugin/pull/249))

<a name="2.10.0"></a>
## 2.10.0

* Add `hash` field to the chunk object
* Add `compilation` field to the templateParam object ([#237](https://github.com/ampedandwired/html-webpack-plugin/issues/237))
* Add `html-webpack-plugin-before-html-generation` event
* Improve error messages

<a name="2.9.0"></a>
## 2.9.0

* Fix favicon path ([#185](https://github.com/ampedandwired/html-webpack-plugin/issues/185), [#208](https://github.com/ampedandwired/html-webpack-plugin/issues/208), [#215](https://github.com/ampedandwired/html-webpack-plugin/pull/215))

<a name="2.8.2"></a>
## 2.8.2

* Support relative URLs on Windows ([#205](https://github.com/ampedandwired/html-webpack-plugin/issues/205))

<a name="2.8.1"></a>
## 2.8.1

* Caching improvements ([#204](https://github.com/ampedandwired/html-webpack-plugin/issues/204))

<a name="2.8.0"></a>
## 2.8.0

* Add `dependency` mode for `chunksSortMode` to sort chunks based on their dependencies with each other

<a name="2.7.2"></a>
## 2.7.2

* Add support for require in js templates

<a name="2.7.1"></a>
## 2.7.1

* Refactoring
* Fix relative windows path

<a name="2.6.5"></a>
## 2.6.5

* Minor refactoring

<a name="2.6.4"></a>
## 2.6.4

* Fix for `"Uncaught TypeError: __webpack_require__(...) is not a function"`
* Fix incomplete cache modules causing "HtmlWebpackPlugin Error: No source available"
* Fix some issues on Windows

<a name="2.6.3"></a>
## 2.6.3

* Prevent parsing the base template with the html-loader

<a name="2.6.2"></a>
## 2.6.2

* Fix `lodash` resolve error ([#172](https://github.com/ampedandwired/html-webpack-plugin/issues/172))

<a name="2.6.1"></a>
## 2.6.1

* Fix missing module ([#164](https://github.com/ampedandwired/html-webpack-plugin/issues/164))

<a name="2.6.0"></a>
## 2.6.0

* Move compiler to its own file
* Improve error messages
* Fix global HTML_WEBPACK_PLUGIN variable

<a name="2.5.0"></a>
## 2.5.0

* Support `lodash` template's HTML _"escape"_ delimiter (`<%- %>`)
* Fix bluebird warning ([#130](https://github.com/ampedandwired/html-webpack-plugin/issues/130))
* Fix an issue where incomplete cache modules were used

<a name="2.4.0"></a>
## 2.4.0

* Don't recompile if the assets didn't change

<a name="2.3.0"></a>
## 2.3.0

* Add events `html-webpack-plugin-before-html-processing`, `html-webpack-plugin-after-html-processing`, `html-webpack-plugin-after-emit` to allow other plugins to alter the html this plugin executes

<a name="2.2.0"></a>
## 2.2.0

* Inject css and js even if the html file is incomplete ([#135](https://github.com/ampedandwired/html-webpack-plugin/issues/135))
* Update dependencies

<a name="2.1.0"></a>
## 2.1.0

* Synchronize with the stable `@1` version

<a name="2.0.4"></a>
## 2.0.4

* Fix `minify` option
* Fix missing hash interpolation in publicPath

<a name="2.0.3"></a>
## 2.0.3

* Add support for webpack.BannerPlugin

<a name="2.0.2"></a>
## 2.0.2

* Add support for loaders in templates ([#41](https://github.com/ampedandwired/html-webpack-plugin/pull/41))
* Remove `templateContent` option from configuration
* Better error messages
* Update dependencies


<a name="1.7.0"></a>
## 1.7.0

* Add `chunksSortMode` option to configuration to control how chunks should be sorted before they are included to the html
* Don't insert async chunks into html ([#95](https://github.com/ampedandwired/html-webpack-plugin/issues/95))
* Update dependencies

<a name="1.6.2"></a>
## 1.6.2

* Fix paths on Windows
* Fix missing hash interpolation in publicPath
* Allow only `false` or `object` in `minify` configuration option

<a name="1.6.1"></a>
## 1.6.1

* Add `size` field to the chunk object
* Fix stylesheet `<link>`s being discarded when used with `"inject: 'head'"`
* Update dependencies

<a name="1.6.0"></a>
## 1.6.0

* Support placing templates in subfolders
* Don't include chunks with undefined name ([#60](https://github.com/ampedandwired/html-webpack-plugin/pull/60))
* Don't include async chunks

<a name="1.5.2"></a>
## 1.5.2

* Update dependencies (lodash)

<a name="1.5.1"></a>
## 1.5.1

* Fix error when manifest is specified ([#56](https://github.com/ampedandwired/html-webpack-plugin/issues/56))

<a name="1.5.0"></a>
## 1.5.0

* Allow to inject javascript files into the head of the html page
* Fix error reporting

<a name="1.4.0"></a>
## 1.4.0

* Add `favicon.ico` option
* Add html minifcation

<a name="1.2.0"></a>
## 1.2.0

* Set charset using HTML5 meta attribute
* Reload upon change when using webpack watch mode
* Generate manifest attribute when using
  [appcache-webpack-plugin](https://github.com/lettertwo/appcache-webpack-plugin)
* Optionally add webpack hash as a query string to resources included in the HTML
  (`hash: true`) for cache busting
* CSS files generated using webpack (for example, by using the
  [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin))
  are now automatically included into the generated HTML
* More detailed information about the files generated by webpack is now available
  to templates in the `o.htmlWebpackPlugin.files` attribute. See readme for more
  details. This new attribute deprecates the old `o.htmlWebpackPlugin.assets` attribute.
* The `templateContent` option can now be a function that returns the template string to use
* Expose webpack configuration to templates (`o.webpackConfig`)
* Sort chunks to honour dependencies between them (useful for use with CommonsChunkPlugin).
