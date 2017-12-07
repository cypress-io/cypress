# semantic-release-monorepo
[![Build Status](https://travis-ci.org/Updater/semantic-release-monorepo.svg?branch=master)](https://travis-ci.org/Updater/semantic-release-monorepo) [![npm](https://img.shields.io/npm/v/semantic-release-monorepo.svg)](https://www.npmjs.com/package/semantic-release-monorepo) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Apply [`semantic-release`'s](https://github.com/semantic-release/semantic-release) automatic publishing to a monorepo.

## Why
The default configuration of `semantic-release` assumes a one-to-one relationship between a Github repository and an `npm` package.

This plugin allows using `semantic-release` with a single Github repository containing many `npm` packages.

## How
Rather than attributing all commits to a single package, this plugin will automatically assign commits to packages based on the files that a commit touched. 

If a commit touched a file within a package's root, it will be considered for that package's next release. Yes, this means a single commit could belong to multiple packages

A push may release multiple package versions. In order to avoid version collisions, git tags are namespaced using the given package's name.

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
    "publish": ["semantic-release-monorepo/npm", "semantic-release-monorepo/github"]
  }
}
```

