const minimist = require('minimist')
const options = minimist(process.argv)
const la = require('lazy-ass')
const is = require('check-more-types')
const execa = require('execa')
const { getNameAndBinary } = require('./utils')

/* eslint-disable no-console */

const { npm, binary } = getNameAndBinary(process.argv)
la(is.unemptyString(npm), 'missing npm url')
la(is.unemptyString(binary), 'missing binary url')

console.log('testing NPM from', npm)
console.log('and binary from', binary)
const cwd = options.cwd || process.cwd()
console.log('in', cwd)

execa.shell(`npm install ${npm}`, {
  cwd,
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
