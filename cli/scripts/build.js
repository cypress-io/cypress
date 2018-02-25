const _ = require('lodash')
const path = require('path')

const fs = require('../lib/fs')

// grab the current version and a few other properties
// from the root package.json
const {
  version,
  description,
  author,
  homepage,
  license,
  bugs,
  repository,
} = require('@packages/root')

// the rest of properties should come from the package.json in CLI folder
const packageJsonSrc = path.join('package.json')
const packageJsonDest = path.join('build', 'package.json')

function preparePackageForNpmRelease (json) {
  // modify the existing package.json
  // to prepare it for releasing to npm
  delete json.devDependencies
  delete json['private']

  _.extend(json, {
    version,
    description,
    author,
    homepage,
    license,
    bugs,
    repository,
    types: 'types', // typescript types
    scripts: {
      postinstall: 'node index.js --exec install',
      size: 't=\"$(npm pack .)\"; wc -c \"${t}\"; tar tvf \"${t}\"; rm \"${t}\";',
    },
  })

  return json
}

fs.readJsonAsync(packageJsonSrc)
.then(preparePackageForNpmRelease)
.then((json) => {
  return fs.outputJsonAsync(packageJsonDest, json, {
    spaces: 2,
  })
})
