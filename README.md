# semantic-release-monorepo
[![Build Status](https://travis-ci.org/Updater/semantic-release-monorepo.svg?branch=master)](https://travis-ci.org/Updater/semantic-release-monorepo) [![npm](https://img.shields.io/npm/v/semantic-release-monorepo.svg)](https://www.npmjs.com/package/semantic-release-monorepo) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Apply [`semantic-release`'s](https://github.com/semantic-release/semantic-release) automatic publishing to a monorepo.

## Why
The default configuration of `semantic-release` assumes a one-to-one relationship between a Github repository and an `npm` package.

This set of plugins allows using `semantic-release` with a single Github repository containing many `npm` packages.

## How
Instead of attributing all commits to a single package, commits are assigned to packages based on the files that a commit touched.

If a commit touched a file in or below a package's root, it will be considered for that package's next release. A single commit can belong to multiple packages.

A push may release multiple package versions. In order to avoid version collisions, git tags are namespaced using the given package's name: `<package-name>-<version>`.

## Install
```bash
npm install -D semantic-release semantic-release-monorepo @semantic-release/npm@2.6.0
```

### Peer dependency on @semantic-release/npm
The `@semantic-release/npm` package is a `semantic-release` plugin that provides functionality for releasing on `npm`. While it's technically optional, it covers a very likely use case and is applied by default by `semantic-release` (minor version dependency, `^2.0.0`). 

Unfortunately, `@semantic-release/npm` version `2.6.1` and above is incompatible with `semantic-release-monorepo` ([discussion](https://github.com/semantic-release/npm/issues/36)). Until a solution is found, `semantic-release-monorepo` only supports the version range `2 - 2.6.0`.

## Usage
Run `semantic-release-monorepo` for the package in the current working directory:
```bash
npx semantic-release -e -semantic-release-monorepo
```
It helps to think about `semantic-releaase-monorepo` as a variation on `semantic-release`'s default behavior, using the latter's plugin system to adapt it to work with a monorepo. 

### With Lerna
The monorepo management tool [`lerna`](https://github.com/lerna/lerna) can be used to run `semantic-release-monorepo` across all packages in a monorepo:

```bash
lerna exec --concurrency 1 -- npx --no-install semantic-release -e -semantic-release-monorepo
```
Note that this requires installing `semantic-release` and `semantic-release-monorepo` for each package.

Alternatively, thanks to how [`npx's package resolution works`](https://github.com/zkat/npx#description), if the repository root is in `$PATH` (typically true on CI), `semantic-release` and `semantic-release-monorepo` can be installed in the repo root instead of for each package, likely saving both time and disk space.

## Configuration
The set of plugins in this package wrap other `semantic-release` plugins to modify their behavior. By default, the same plugin configuration as `semantic-release` is used, but any plugin configuration should be compatible.

### Release config
Plugins can be configured in the [release config](https://github.com/semantic-release/semantic-release#plugins), with one important caveat:

Due to limitations in how plugins may be composed ([discussion](https://github.com/semantic-release/semantic-release/issues/550)), `semantic-release-monorepo` must unfortunately "hard-code" the set of plugins it wraps: `analyze-commits`, `generateNotes`, `getLastRelease` and `publish`.

Users may still want to define a custom versions of the plugin set, or want to pass options to the default versions. To work around this problem, set the desired plugin configuration under the `monorepo` property  instead.

#### Example of use with non-default set of plugins
`package.json`
```json
{
  "release": {
    "verifyConditions": ["@semantic-release/git"],
    "monorepo": {
      "analyzeCommits": {
        "format": "atom"
      },
      "generateNotes": "myNotesGenerator",
      "getLastRelease": "@semantic-release/git",
      "publish": ["@semantic-release/npm", "@semantic-release/git"]
    }  
  }
}
```
### Advanced
The set of `semantic-release-monorepo` plugins wrap the default `semantic-release` workflow, augmenting it to work with a monorepo.

#### analyzeCommits
* Filters the repo commits to only include those that touched files in the given monorepo package.

#### generateNotes
* Filters the repo commits to only include those that touched files in the given monorepo package.

* Maps the `gitTag` fields of `lastRelease` and `nextRelease` to use the [monorepo git tag format](#how).

* Maps the `version` field of `nextRelease` to use the [monorepo git tag format](#how). The wrapped (default) `generateNotes` implementation uses `version` as the header for the release notes. Since all release notes end up in the same Github repository, using just the version as a header introduces ambiguity.

#### getLastRelease
Addresses multiple problems identifying the last release for a monorepo package:

  1. The wrapped (default) `getLastRelease` plugin uses `gitHead` from the `npm` package metadata to identify the last release. However, `npm` doesn't publish `gitHead` as part of a package's metadata unless its `package.json` and the repo's `.git` are in the same folder (never true for a monorepo). 
  https://github.com/npm/read-package-json/issues/66#issuecomment-222036879
  
  2. We can use `semantic-release`'s fallback strategy, searching for a git tag matching the latest `npm` version, but we must map the git tag to the [monorepo git tag format](#how).

#### publish
* Maps the `gitTag` field of `nextRelease` to use the [monorepo git tag format](#how).