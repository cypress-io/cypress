# semantic-release-monorepo
[![Build Status](https://travis-ci.org/Updater/semantic-release-monorepo.svg?branch=master)](https://travis-ci.org/Updater/semantic-release-monorepo) [![npm](https://img.shields.io/npm/v/semantic-release-monorepo.svg)](https://www.npmjs.com/package/semantic-release-monorepo) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Apply [`semantic-release`'s](https://github.com/semantic-release/semantic-release) automatic publishing to a monorepo.

## Why
The default configuration of `semantic-release` assumes a one-to-one relationship between a Github repository and an `npm` package.

This plugin allows using `semantic-release` with a single Github repository containing many `npm` packages.

## How
Rather than attributing all commits to a single package, this plugin will automatically assign commits to packages based on the files that a commit touched. 

If a commit touched a file within a package's root, it will be considered for that package's next release. Yes, this means a single commit could belong to multiple packages.

A push may release multiple package versions. In order to avoid version collisions, git tags are namespaced using the given package's name: `<package-name>-<version>`.

## Configuration
This package is a complement to `semantic-release`. It is assumed the user is already fully familiar with that package and its workflow.

## Install
```bash
npm install -D semantic-release-monorepo
```

## Usage
In `package.json`:
```json
{
  "release": {
    "analyzeCommits": "semantic-release-monorepo",
    "generateNotes": "semantic-release-monorepo",
    "getLastRelease": "semantic-release-monorepo",
    "publish": ["@semantic-release/npm", "semantic-release-monorepo/github"]
  }
}
```

## What each plugin does
All `semantic-release-monorepo` plugins wrap the default `semantic-release` workflow, augmenting it to work with a monorepo.

### analyzeCommits
* Filters the repo commits to only include those that touched files in the given monorepo package.

### generateNotes
* Filters the repo commits to only include those that touched files in the given monorepo package.

* Maps the `gitTag` fields of `lastRelease` and `nextRelease` to use the [monorepo git tag format](#how).

* Maps the `version` field of `nextRelease` to use the [monorepo git tag format](#how). The wrapped (default) `generateNotes` implementation uses `version` as the header for the release notes. Since all release notes end up in the same Github repository, using just the version as a header introduces ambiguity.

### getLastRelease
Addresses multiple problems identifying the last release for a monorepo package:

  1. The wrapped (default) `getLastRelease` plugin uses `gitHead` from the `npm` package metadata to identify the last release. However, `npm` doesn't publish `gitHead` as part of a package's metadata unless its `package.json` and the repo's `.git` are in the same folder (never true for a monorepo). 
  https://github.com/npm/read-package-json/issues/66#issuecomment-222036879
  
  2. We can use `semantic-release`'s fallback strategy, searching for a git tag matching the latest `npm` version, but we must map the git tag to the [monorepo git tag format](#how).

### publish (Github)
* Maps the `gitTag` field of `nextRelease` to use the [monorepo git tag format](#how).