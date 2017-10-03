const minimist = require('minimist')
const options = minimist(process.argv)
const la = require('lazy-ass')
const is = require('check-more-types')
const execa = require('execa')
const { getNameAndBinary } = require('./utils')

/* eslint-disable no-console */

const { npmUrl, binaryUrl } = getNameAndBinary(process.argv)
la(is.unemptyString(npmUrl), 'missing npm url')
la(is.unemptyString(binaryUrl), 'missing binary url')

console.log('testing NPM from', npmUrl)
console.log('and binary from', binaryUrl)
const cwd = options.cwd || process.cwd()
console.log('in', cwd)

execa.shell(`npm install ${npmUrl}`, {
  cwd,
  stdio: 'inherit',
  env: {
    CYPRESS_BINARY_VERSION: binaryUrl,
  },
})
.then(console.log)
.catch((e) => {
  console.error(e)
  process.exit(1)
})
