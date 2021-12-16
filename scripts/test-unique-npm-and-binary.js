/* eslint-disable no-console */
const minimist = require('minimist')
const options = minimist(process.argv)
const la = require('lazy-ass')
const fs = require('fs-extra')
const is = require('check-more-types')
const execa = require('execa')
const { getNameAndBinary } = require('./utils')

const cwd = options.cwd || '/tmp/testing'

fs.ensureDirSync(cwd)

console.log('Create Dummy Project')
execa('npm init -y', {
  cwd,
  shell: true,
  stdio: 'inherit',
})
.then(console.log)
.catch((e) => {
  console.error(e)
  process.exit(1)
})

const { npm, binary } = getNameAndBinary(process.argv)

la(is.unemptyString(npm), 'missing npm url')
la(is.unemptyString(binary), 'missing binary url')

console.log('testing NPM from', npm)
console.log('and binary from', binary)

console.log('in', cwd)

execa(`npm install ${npm}`, {
  cwd,
  shell: true,
  stdio: 'inherit',
  env: {
    CYPRESS_INSTALL_BINARY: binary,
  },
})
.then(console.log)
.catch((e) => {
  console.error(e)
  process.exit(1)
})

console.log('Verify Cypress binary')
execa('$(yarn bin cypress) verify', {
  cwd,
  shell: true,
  stdio: 'inherit',
})
.then(console.log)
.catch((e) => {
  console.error(e)
  process.exit(1)
})
