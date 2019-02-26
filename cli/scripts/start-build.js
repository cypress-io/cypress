#!/usr/bin/env node

const shell = require('shelljs')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

shell.rm('-rf', 'build')
shell.mkdir('-p', 'build/bin')
shell.mkdir('-p', 'build/types')
shell.cp('bin/cypress', 'build/bin/cypress')
shell.cp('NPM_README.md', 'build/README.md')
shell.cp('.release.json', 'build/.release.json')
shell.cp('-R', 'types/*.ts', 'build/types/')

shell.exec('babel lib -d build/lib')
shell.exec('babel index.js -o build/index.js')
