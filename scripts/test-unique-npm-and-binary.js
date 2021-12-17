/* eslint-disable no-console */
const minimist = require('minimist')
const os = require('os')
const la = require('lazy-ass')
const fs = require('fs-extra')
const is = require('check-more-types')
const execa = require('execa')
const { getNameAndBinary } = require('./utils')

const options = minimist(process.argv)

const cwd = options.cwd || '/tmp/testing'

fs.ensureDirSync(cwd)

const spawnOpts = {
  cwd,
  shell: os.platform() === 'win32' ? 'bash.exe' : '/bin/bash',
  stdio: 'inherit',
}
const { npm, binary } = getNameAndBinary(process.argv)

la(is.unemptyString(npm), 'missing npm url')
la(is.unemptyString(binary), 'missing binary url')

console.log('Create Dummy Project')
execa('npm init -y', spawnOpts)
.then(console.log)
.then(() => {
  console.log('testing NPM from', npm)
  console.log('and binary from', binary)
  console.log('in', cwd)

  return execa(`npm install ${npm}`, {
    ...spawnOpts,
    env: {
      CYPRESS_INSTALL_BINARY: binary,
    },
  }).then(console.log)
})
.then(() => {
  console.log('Verify Cypress binary')

  return execa('$(yarn bin cypress) verify', spawnOpts)
  .then(console.log)
})
.catch((e) => {
  console.error(e)
  process.exit(1)
})
