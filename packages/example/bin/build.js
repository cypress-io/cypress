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
  if (!fs.existsSync(path.join(EXAMPLE_DIR, 'cypress', 'e2e'))) {
    await fs.move(path.join(EXAMPLE_DIR, 'cypress', 'integration'), path.join(EXAMPLE_DIR, 'cypress', 'e2e'))
  }
  const files = await globAsync('cypress/e2e/**/*.spec.js', {
    cwd: EXAMPLE_DIR
  })
  await Promise.all(files.map(f => fs.move(f, f.replace('.spec.js', '.cy.js'))))
  try {
    await fs.move(path.join(EXAMPLE_DIR, 'cypress', 'support', 'index.js'), path.join(EXAMPLE_DIR, 'cypress', 'support', 'e2e.js'))
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
  }
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
