#!/usr/bin/env node

const shell = require('shelljs')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

shell.rm('-rf', 'app')
shell.mkdir('app')

shell.cp('-r', 'node_modules/cypress-example-kitchensink/app', '.')
shell.rm('-rf', 'cypress')

shell.cp('-r', 'node_modules/cypress-example-kitchensink/cypress', '.')

shell.exec('node ./bin/convert.js')
