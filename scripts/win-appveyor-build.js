#!/usr/bin/env node

/* eslint-disable no-console */

// builds Windows binary on AppVeyor CI
// but only on the right branch

const shell = require('shelljs')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

// https://www.appveyor.com/docs/environment-variables/

const isRightBranch = () =>
  process.env.APPVEYOR_REPO_BRANCH === 'develop'

const isPullRequest = () =>
  Boolean(process.env.APPVEYOR_PULL_REQUEST_NUMBER)

const shouldBuildBinary = () =>
  isRightBranch() && !isPullRequest()

if (!shouldBuildBinary()) {
  console.log('should not build binary')
  process.exit(0)
}

console.log('building binary')
