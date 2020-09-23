# semantic-release-monorepo

[![Build Status](https://travis-ci.org/pmowrer/semantic-release-monorepo.svg?branch=master)](https://travis-ci.org/pmowrer/semantic-release-monorepo) [![npm](https://img.shields.io/npm/v/semantic-release-monorepo.svg)](https://www.npmjs.com/package/semantic-release-monorepo) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Apply [`semantic-release`'s](https://github.com/semantic-release/semantic-release) automatic publishing to a monorepo.

## Why
 The default configuration of `semantic-release` assumes a one-to-one relationship between a GitHub repository and an `npm` package.

This library allows using `semantic-release` with a single GitHub repository containing many `npm` packages.

## How

Instead of attributing all commits to a single package, commits are assigned to packages based on the files that a commit touched.

If a commit touched a file in or below a package's root, it will be considered for that package's next release. A single commit can belong to multiple packages and may trigger the release of multiple packages.

In order to avoid version collisions, generated git tags are namespaced using the given package's name: `<package-name>-<version>`.

## Install
Both `semantic-release` and `semantic-release-monorepo` must be accessible in each monorepo package.

```bash
npm install -D semantic-release semantic-release-monorepo
```

## Usage

Run `semantic-release` in the **root of a monorepo package** and apply `semantic-release-monorepo` via the [`extends`](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#extends) option.

On the command line:
```bash
$ npm run semantic-release -e semantic-release-monorepo
```

Or in the [release config](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration-file):
```json
{
  "extends": "semantic-release-monorepo"
}
```

NOTE: This library **CAN'T** be applied via the `plugins` option.

```json
{
  "plugins": [
    "semantic-release-monorepo" // This WON'T work
  ]
}
```

### With Lerna
The monorepo management tool [`lerna`](https://github.com/lerna/lerna) can be used to run `semantic-release-monorepo` across all packages in a monorepo with a single command:

```bash
lerna exec --concurrency 1 -- npx --no-install semantic-release -e semantic-release-monorepo
```

 Thanks to how [`npx's package resolution works`](https://github.com/npm/npx#description), if the repository root is in `$PATH` (typically true on CI), `semantic-release` and `semantic-release-monorepo` can be installed once in the repo root instead of in each individual package, likely saving both time and disk space.

## Advanced
This library modifies the `context` object passed to `semantic-release` plugins in the following way to make them compatible with a monorepo.

| Step               | Description                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `analyzeCommits` | Filters `context.commits` to only include the given monorepo package's commits.                              |
| `generateNotes`          | <ul><li>Filters `context.commits` to only include the given monorepo package's commits.</li><li>Modifies `context.nextRelease.version` to use the [monorepo git tag format](#how). The wrapped (default) `generateNotes` implementation uses this variable as the header for the release notes. Since all release notes end up in the same Github repository, using just the version as a header introduces ambiguity.</li></ul>   |

### tagFormat

Pre-configures the [`tagFormat` option](https://github.com/semantic-release/semantic-release/blob/caribou/docs/usage/configuration.md#tagformat) to use the [monorepo git tag format](#how).

If you are using Lerna, you can customize the format using the following command:

```
"semantic-release": "lerna exec --concurrency 1 -- semantic-release -e semantic-release-monorepo --tag-format='${LERNA_PACKAGE_NAME}-v\\${version}'"
```

Where `'${LERNA_PACKAGE_NAME}-v\\${version}'` is the string you want to customize.   By default it will be `<PACKAGE_NAME>-v<VERSION>` (e.g. `foobar-v1.2.3`).
