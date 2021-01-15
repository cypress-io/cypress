#!/usr/bin/env node

/* eslint-disable no-console */
// @ts-check

// builds Windows binary on AppVeyor CI
// but only on the right branch

const shell = require('shelljs')
const os = require('os')
const la = require('lazy-ass')
const is = require('check-more-types')
// const assert = require('assert')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

// see what variables AppVeyor provides
// https://www.appveyor.com/docs/environment-variables/

const isRightBranch = () => {
  const branch =
    process.env.APPVEYOR_PULL_REQUEST_HEAD_REPO_BRANCH ||
    process.env.APPVEYOR_REPO_BRANCH
  const shouldForceBinaryBuild = (
    process.env.APPVEYOR_REPO_COMMIT_MESSAGE || ''
  ).includes('[build binary]')

  const branchesToBuildBinary = ['develop', 'revert-create-cypress-tests']

  return branchesToBuildBinary.includes(branch) || shouldForceBinaryBuild
}

const isForkedPullRequest = () => {
  const repoName = process.env.APPVEYOR_PULL_REQUEST_HEAD_REPO_NAME

  return repoName && repoName !== 'cypress-io/cypress'
}

const shouldBuildBinary = () => {
  return isRightBranch() && !isForkedPullRequest()
}

if (!shouldBuildBinary()) {
  console.log('should not build binary')
  process.exit(0)
}

console.log('building Windows binary')

const filename = `cypress-v${process.env.NEXT_DEV_VERSION}.tgz`
const version = process.env.NEXT_DEV_VERSION

la(is.unemptyString(version), 'missing NEXT_DEV_VERSION')

console.log('building version', version)

shell.exec(
  `node scripts/binary.js upload-npm-package --file cli/build/${filename} --version ${version}`,
)

const arch = os.arch()

shell.echo(`Building for win32 [${arch}]...`)

shell.cat('npm-package-url.json')
shell.exec(`yarn binary-build --platform windows --version ${version}`)

// make sure we are not including dev dependencies accidentally
// TODO how to get the server package folder?
const serverPackageFolder = 'C:/projects/cypress/dist/win32/packages/server'

shell.echo(`Checking prod and dev dependencies in ${serverPackageFolder}`)
shell.exec('yarn list --prod --depth 0 || true')
const result = shell.exec('yarn list --dev --depth 0 || true', {
  cwd: serverPackageFolder,
})

if (result.stdout.includes('nodemon')) {
  console.error('Hmm, server package includes dev dependency "coveralls"')
  console.error(
    'which means somehow we are including dev dependencies in the output bundle',
  )

  console.error('see https://github.com/cypress-io/cypress/issues/2896')
  process.exit(1)
}

// const pathToExe = 'C:/projects/cypress/build/win32/Cypress/Cypress.exe'

// // verify that Cypress.exe is either 32bit or 64bit based on node's arch
// const dumpbin = shell.exec(`dumpbin /headers ${pathToExe}`)

// // eslint-disable-next-line default-case
// switch (arch) {
//   case 'ia32':
//     assert.ok(dumpbin.stdout.includes('machine (x86)'))
//     break

//   case 'x64':
//     assert.ok(dumpbin.stdout.includes('machine (x64)'))
//     break
// }

/**
 * Returns true if we are building a pull request
 */
const isPullRequest = () => {
  return Boolean(process.env.APPVEYOR_PULL_REQUEST_NUMBER)
}

if (isPullRequest()) {
  console.log('This is a pull request, skipping uploading binary')
} else {
  console.log('Zipping and upload binary')

  shell.exec('yarn binary-zip')
  shell.ls('-l', '*.zip')
  shell.exec(
    `node scripts/binary.js upload-unique-binary --file cypress.zip --version ${version}`,
  )

  shell.cat('binary-url.json')
  shell.exec(
    'node scripts/add-install-comment.js --npm npm-package-url.json --binary binary-url.json',
  )

  shell.exec(
    'node scripts/test-other-projects.js --npm npm-package-url.json --binary binary-url.json --provider appVeyor',
  )
}
