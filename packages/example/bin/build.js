#!/usr/bin/env node

const resolvePkg = require('resolve-pkg')
const { join } = require('path')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const util = require('util')
const childProcess = require('child_process')

const EXAMPLE_DIR = path.join(__dirname, '..')
const globAsync = util.promisify(glob)

async function build() {
  await Promise.all([
    fs.remove(path.join(EXAMPLE_DIR, 'app')),
    fs.remove(path.join(EXAMPLE_DIR, 'cypress'))
  ])
  await Promise.all([
    fs.copy(join(resolvePkg('cypress-example-kitchensink'), 'app'), path.join(EXAMPLE_DIR, 'app')),
    fs.copy(join(resolvePkg('cypress-example-kitchensink'), 'cypress'), path.join(EXAMPLE_DIR, 'cypress')),
  ])
  childProcess.execSync('node ./bin/convert.js', {
    cwd: EXAMPLE_DIR,
    stdio: 'inherit'
  })
}

build().then(() => {
  console.log('Built example')
  process.exit(0)
}).catch((e) => {
  console.error(e.stack)
  process.exit(1)
})
