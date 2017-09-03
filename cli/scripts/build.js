const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

// grab the current version from the root monorepo package.json
const {
  version,
  description,
  author,
  homepage,
  license,
  bugs,
  repository,
  engines,
} = require('@packages/root')

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
    engines,
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
