#!/usr/bin/env node

const { includeTypes } = require('./utils')
const { join } = require('path')
const shell = require('shelljs')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

shell.rm('-rf', 'build')
shell.mkdir('-p', 'build/bin')
shell.mkdir('-p', 'build/types')
shell.cp('bin/cypress', 'build/bin/cypress')
shell.cp('NPM_README.md', 'build/README.md')
shell.cp('.release.json', 'build/.release.json')
// copies our typescript definitions
shell.cp('-R', 'types/*.ts', 'build/types/')
// copies 3rd party typescript definitions
includeTypes.forEach((folder) => {
  const source = join('types', folder)

  shell.cp('-R', source, 'build/types')
})

// TODO: Add a typescript or rollup build step
// The only reason start-build.js exists
// is because the cli package does not have an actual
// build process to compile index.js and lib
shell.exec('babel lib -d build/lib')
shell.exec('babel index.js -o build/index.js')
shell.cp('index.mjs', 'build/index.mjs')
