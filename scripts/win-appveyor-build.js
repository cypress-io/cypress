#!/usr/bin/env node

/* eslint-disable no-console */

// builds Windows binary on AppVeyor CI
// but only on the right branch

const shell = require('shelljs')
const la = require('lazy-ass')
const is = require('check-more-types')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

// https://www.appveyor.com/docs/environment-variables/

const isRightBranch = () => {
  const branch = process.env.APPVEYOR_REPO_BRANCH
  return branch === 'develop' ||
    branch === 'win-build-shell' ||
    branch === 'no-dev-deps-in-windows-binary-2896'
}

const isPullRequest = () => {
  return Boolean(process.env.APPVEYOR_PULL_REQUEST_NUMBER)
}

const shouldBuildBinary = () => {
  return isRightBranch() && !isPullRequest()
}

if (!shouldBuildBinary()) {
  console.log('should not build binary')
  process.exit(0)
}

console.log('building Windows binary')

const filename = `cypress-${process.env.NEXT_DEV_VERSION}.tgz`
const version = process.env.NEXT_DEV_VERSION

la(is.unemptyString(version), 'missing NEXT_DEV_VERSION')

console.log('building version', version)

shell.exec(`node scripts/binary.js upload-npm-package --file cli/build/${filename} --version ${version}`)
shell.cat('npm-package-url.json')
shell.exec(`npm run binary-build -- --platform windows --version ${version}`)

// make sure we are not including dev dependencies accidentally
// https://github.com/cypress-io/cypress/issues/2896
shell.exec('npm ls --prod --depth 0', {cwd: 'packages/server'})
const result = shell.exec('npm ls --dev --depth 0', {cwd: 'packages/server'})
if (result.stdout.includes('nodemon')) {
  console.error('Hmm, server package includes dev dependency "nodemon"')
  process.exit(1)
}

shell.exec('npm run binary-zip')
shell.ls('-l', '*.zip')
shell.exec(`node scripts/binary.js upload-unique-binary --file cypress.zip --version ${version}`)
shell.cat('binary-url.json')
shell.exec('node scripts/test-other-projects.js --npm npm-package-url.json --binary binary-url.json --provider appVeyor')
