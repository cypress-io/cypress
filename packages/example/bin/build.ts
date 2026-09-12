#!/usr/bin/env tsx

/* eslint-disable no-console */

import childProcess from 'child_process'
import fs from 'fs-extra'
import path, { join } from 'path'
import resolvePkg from 'resolve-pkg'

const EXAMPLE_DIR = path.join(__dirname, '..')

async function build () {
  const kitchensinkDir = resolvePkg('cypress-example-kitchensink')

  if (!kitchensinkDir) {
    throw new Error('Could not resolve `cypress-example-kitchensink`. Run `yarn` from the monorepo root first.')
  }

  await Promise.all([
    fs.remove(path.join(EXAMPLE_DIR, 'app')),
    fs.remove(path.join(EXAMPLE_DIR, 'cypress')),
  ])

  await Promise.all([
    fs.copy(join(kitchensinkDir, 'app'), path.join(EXAMPLE_DIR, 'app')),
    fs.copy(join(kitchensinkDir, 'cypress'), path.join(EXAMPLE_DIR, 'cypress')),
  ])

  childProcess.execSync('tsx ./bin/convert.ts', {
    cwd: EXAMPLE_DIR,
    stdio: 'inherit',
  })
}

build().then(() => {
  console.log('Built example')
  process.exit(0)
}).catch((e) => {
  console.error(e.stack)
  process.exit(1)
})
