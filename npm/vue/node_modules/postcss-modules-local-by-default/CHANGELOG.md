# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [3.0.3] - 2020-07-25
### Fixed
- treat `:import` and `:export` statements as pure

## [3.0.2] - 2019-06-05
### Fixed
- better handle invalid syntax

## [3.0.1] - 2019-05-16
### Fixed
- adds safety check before accessing "rule parent"

## [3.0.0] - 2019-05-07
### Features
- don't localize imported values in selectors 
### Changes
- don't localize imported values in selectors 

## [2.0.6] - 2019-03-05
### Fixed
- handles properly selector with escaping characters (like: `.\31 a2b3c { color: red }`)

## [2.0.5] - 2019-02-06
### Fixed
- Path to `index.js`

## [2.0.4] - 2019-01-04
### Fixed
- Inappropriate modification of `steps` function arguments

## [2.0.3] - 2018-12-21
### Fixed
- Don't modify inappropriate animation keywords

## [2.0.2] - 2018-12-05
### Fixed
- Don't break unicode characters.

## [2.0.1] - 2018-11-23
### Fixed
- Handle uppercase `keyframes` at rule.

## [2.0.0] - 2018-11-23
### Changed
- Drop support `nodejs@4`.
- Update `postcss` version to `7`.

## [0.0.11] - 2015-07-19
### Fixed
- Localisation of animation properties.

## [0.0.10] - 2015-06-17
### Added
- Localised at-rules.

## [0.0.9] - 2015-06-12
### Changed
- Using global selectors outside of a global context no longer triggers warnings. Instead, this functionality will be provided by a CSS Modules linter.

### Fixed
- Keyframe rules.

## [0.0.8] - 2015-06-11
### Added
- Pure mode where only local scope is allowed.

### Changed
- Using global selectors outside of a global context now triggers warnings.

## [0.0.7] - 2015-05-30
### Changed
- Migrated to `css-selector-tokenizer`.

## [0.0.6] - 2015-05-28
### Changed
- Renamed project to `postcss-modules-local-by-default`.

## [0.0.5] - 2015-05-22
### Added
- Support for css-loader [inheritance](https://github.com/webpack/css-loader#inheriting) and [local imports](https://github.com/webpack/css-loader#importing-local-class-names).

## [0.0.4] - 2015-05-22
### Changed
- Hide global leak detection behind undocumented `lint` option until it's more robust.

## [0.0.3] - 2015-05-22
### Changed
- Transformer output now uses the new `:local(.identifier)` syntax.

### Added
- Simple global leak detection. Non-local selectors like `input{}` and `[data-foobar]` now throw when not marked as global.

## [0.0.2] - 2015-05-14
### Added
- Support for global selectors appended directly to locals, e.g. `.foo:global(.bar)`

## 0.0.1 - 2015-05-12
### Added
- Automatic local classes
- Explicit global selectors with `:global`

[unreleased]: https://github.com/postcss-modules-local-by-default/compare/v0.0.10...HEAD
[0.0.2]:      https://github.com/postcss-modules-local-by-default/compare/v0.0.1...v0.0.2
[0.0.3]:      https://github.com/postcss-modules-local-by-default/compare/v0.0.2...v0.0.3
[0.0.4]:      https://github.com/postcss-modules-local-by-default/compare/v0.0.3...v0.0.4
[0.0.5]:      https://github.com/postcss-modules-local-by-default/compare/v0.0.4...v0.0.5
[0.0.6]:      https://github.com/postcss-modules-local-by-default/compare/v0.0.5...v0.0.6
[0.0.7]:      https://github.com/postcss-modules-local-by-default/compare/v0.0.6...v0.0.7
[0.0.8]:      https://github.com/postcss-modules-local-by-default/compare/v0.0.7...v0.0.8
[0.0.9]:      https://github.com/postcss-modules-local-by-default/compare/v0.0.8...v0.0.9
[0.0.10]:      https://github.com/postcss-modules-local-by-default/compare/v0.0.9...v0.0.10
[0.0.11]:      https://github.com/postcss-modules-local-by-default/compare/v0.0.10...v0.0.11
[2.0.0]:      https://github.com/postcss-modules-local-by-default/compare/v1.3.1...v2.0.0
[2.0.1]:      https://github.com/postcss-modules-local-by-default/compare/v2.0.0...v2.0.1
