# semantic-release-monorepo

[![Build Status](https://travis-ci.org/pmowrer/semantic-release-monorepo.svg?branch=master)](https://travis-ci.org/pmowrer/semantic-release-monorepo) [![npm](https://img.shields.io/npm/v/semantic-release-monorepo.svg)](https://www.npmjs.com/package/semantic-release-monorepo) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Apply [`semantic-release`'s](https://github.com/semantic-release/semantic-release) automatic publishing to a monorepo.

## Why

The default configuration of `semantic-release` assumes a one-to-one relationship between a GitHub repository and an `npm` package.

This set of plugins allows using `semantic-release` with a single GitHub repository containing many `npm` packages.

## How

Instead of attributing all commits to a single package, commits are assigned to packages based on the files that a commit touched.

If a commit touched a file in or below a package's root, it will be considered for that package's next release. A single commit can belong to multiple packages and a merge may release multiple package versions. 

In order to avoid version collisions, release git tags are namespaced using the given package's name: `<package-name>-<version>`.

## Install

```bash
npm install -D semantic-release semantic-release-monorepo
```

## Usage

Run `semantic-release-monorepo` for the package in the current working directory:

```bash
npx semantic-release -e semantic-release-monorepo
```

It helps to think about `semantic-release-monorepo` as a variation on `semantic-release`'s default behavior, using the latter's plugin system to adapt it to work with a monorepo.

### With Lerna

The monorepo management tool [`lerna`](https://github.com/lerna/lerna) can be used to run `semantic-release-monorepo` across all packages in a monorepo:

```bash
lerna exec --concurrency 1 -- npx --no-install semantic-release -e semantic-release-monorepo
```

Note that this requires installing `semantic-release` and `semantic-release-monorepo` for each package.

Alternatively, thanks to how [`npx's package resolution works`](https://github.com/zkat/npx#description), if the repository root is in `$PATH` (typically true on CI), `semantic-release` and `semantic-release-monorepo` can be installed once in the repo root instead of in each individual package, likely saving both time and disk space.

### Performance
Naturally, the more packages in a monorepo, the longer it takes `semantic-release` to run against all of them. If total runtime becomes a problem, consider the following optimization:

#### Reduce expensive network calls (50%+ runtime reduction)
By default, `semantic-release`'s `verifyConditions` plugin configuration contains `@semantic-release/npm` and `@semantic-release/github`. These two plugins each make a network call to verify that credentials for the respective services are properly configured. When running in a monorepo, these verifications will be redundantly repeated for each and every package, greatly contributing to overall runtime. Optimally, we'd only want make these verification calls one time.

By moving these plugins to the `verifyRelease` configuration, they will only run if `semantic-release` determines a release is to be made for a given package (at a time when the given verifications are actually relevant). Likely, most times `semantic-release` is run over a monorepo, only a small subset of all packages trigger releases.

NOTE: To allow for dynamic code, this example defines the release configuration in [`.releaserc.js`](https://github.com/semantic-release/semantic-release/blob/caribou/docs/usage/configuration.md#configuration) instead of inside of `package.json`.

```js
module.exports = {
  verifyConditions: [],
  verifyRelease: ['@semantic-release/npm', '@semantic-release/github']
    .map(require)
    .map(x => x.verifyConditions),
};
```

### Advanced

The set of `semantic-release-monorepo` plugins wrap the default `semantic-release` workflow, augmenting it to work with a monorepo.

#### analyzeCommits

* Filters the repo commits to only include those that touched files in the given monorepo package.

#### generateNotes

* Filters the repo commits to only include those that touched files in the given monorepo package.

* Maps the `version` field of `nextRelease` to use the [monorepo git tag format](#how). The wrapped (default) `generateNotes` implementation uses `version` as the header for the release notes. Since all release notes end up in the same Github repository, using just the version as a header introduces ambiguity.

#### tagFormat

Pre-configures the [`tagFormat` option](https://github.com/semantic-release/semantic-release/blob/caribou/docs/usage/configuration.md#tagformat) to use the [monorepo git tag format](#how).

If you are using Lerna, you can customize the format using the following command:

```
"semantic-release": "lerna exec --concurrency 1 -- semantic-release -e semantic-release-monorepo --tag-format='${LERNA_PACKAGE_NAME}-v\\${version}'"
```

Where `'${LERNA_PACKAGE_NAME}-v\\${version}'` is the string you want to customize.  
By default it will be `<PACKAGE_NAME>-v<VERSION>` (e.g. `foobar-v1.2.3`).
