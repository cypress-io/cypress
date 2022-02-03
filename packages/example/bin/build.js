#!/usr/bin/env node

const shell = require('shelljs')
const resolvePkg = require('resolve-pkg')
const { join } = require('path')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

shell.rm('-rf', 'app')
shell.cp('-r', join(resolvePkg('cypress-example-kitchensink'), 'app'), '.')

shell.rm('-rf', 'cypress')
shell.cp('-r', join(resolvePkg('cypress-example-kitchensink'), 'cypress'), '.')

// TODO: remove once example-kitchensink has this
shell.touch(join('cypress', 'support', 'e2e.js'))

shell.exec('node ./bin/convert.js')
