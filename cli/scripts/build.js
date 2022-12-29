const _ = require('lodash')
const path = require('path')
const shell = require('shelljs')

const fs = require('../lib/fs')

// grab the current version and a few other properties
// from the root package.json
const {
  version,
  description,
  homepage,
  license,
  bugs,
  repository,
  keywords,
} = require('@packages/root')

// the rest of properties should come from the package.json in CLI folder
const packageJsonSrc = path.join('package.json')
const packageJsonDest = path.join('build', 'package.json')

function getStdout (cmd) {
  return shell.exec(cmd).trim()
}

function preparePackageForNpmRelease (json) {
  // modify the existing package.json
  // to prepare it for releasing to npm
  delete json.devDependencies
  delete json['private']
  // no need to include "nyc" code coverage settings
  delete json.nyc
  delete json.workspaces

  _.extend(json, {
    version,
    buildInfo: {
      commitBranch: process.env.CIRCLE_BRANCH || getStdout('git branch --show-current'),
      commitSha: getStdout('git rev-parse HEAD'),
      commitDate: new Date(getStdout('git show -s --format=%ci')).toISOString(),
      stable: false,
    },
    description,
    homepage,
    license,
    bugs,
    repository,
    keywords,
    types: 'types', // typescript types
    scripts: {
      postinstall: 'node index.js --exec install',
      size: 't=\"$(npm pack .)\"; wc -c \"${t}\"; tar tvf \"${t}\"; rm \"${t}\";',
    },
  })

  return json
}

function makeUserPackageFile () {
  return fs.readJsonAsync(packageJsonSrc)
  .then(preparePackageForNpmRelease)
  .then((json) => {
    return fs.outputJsonAsync(packageJsonDest, json, {
      spaces: 2,
    })
    .return(json) // returning package json object makes it easy to test
  })
}

module.exports = makeUserPackageFile

if (!module.parent) {
  makeUserPackageFile()
  .catch((err) => {
    /* eslint-disable no-console */
    console.error('Could not write user package file')
    console.error(err)
    /* eslint-enable no-console */
    process.exit(-1)
  })
}
