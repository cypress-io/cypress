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
shell.mv(join('cypress', 'integration'), join('cypress', 'e2e'))
shell.exec(`
  for f in cypress/e2e/**/*.spec.js; do
  mv -- "$f" "\${f%.spec.js}.cy.js"
  done
`)

shell.exec('node ./bin/convert.js')
