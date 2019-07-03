// this build utility script posts on the commit in the default branch "develop"
// telling the user how they can install pre-release build of the Test Runner

require('@packages/coffee/register')

const la = require('lazy-ass')
const is = require('check-more-types')
const os = require('os')
const {
  getNameAndBinary,
  getShortCommit,
  getCIName,
  getCIBuildUrl,
} = require('./utils')
const { addCommitComment } = require('@cypress/github-commit-status-check')
const { stripIndent } = require('common-tags')

/* eslint-disable no-console */

const { npm, binary } = getNameAndBinary(process.argv)

la(is.unemptyString(npm), 'missing npm url')
la(is.unemptyString(binary), 'missing binary url')

const commitInfo = getShortCommit()

la(is.object(commitInfo), 'could not determine current commit information')
const { sha } = commitInfo

la(is.commitId(sha), 'could not find commit SHA')

const platform = os.platform()
const arch = os.arch()

console.log('posting pre-release instructions')
console.log(' commit:', sha)
console.log(' npm:', npm)
console.log(' binary:', binary)
console.log(' platform:', platform)
console.log(' arch:', arch)

const ciName = getCIName() || 'unknown'
const buildUrl = getCIBuildUrl()
const buildInfo = buildUrl ? `The build is [here](${buildUrl})` : ''
const instructionsAt =
  'https://on.cypress.io/installing-cypress#Install-pre-release-version'
const preamble = stripIndent`
  CI ${ciName} has built ${platform} ${arch} version of the Test Runner. ${buildInfo}
  You can install this pre-release platform-specific build using instructions at [${instructionsAt}](${instructionsAt}).

  You will need to use custom \`CYPRESS_INSTALL_BINARY\` url and install Cypress using an url instead of the version.
`

const getLinuxInstallMessage = () => {
  return stripIndent`
    ${preamble}

    export CYPRESS_INSTALL_BINARY=${binary}
    npm install ${binary}
  `
}

const getWindowsInstallMessage = () => {
  return stripIndent`
    ${preamble}

    set CYPRESS_INSTALL_BINARY=${binary}
    npm install ${binary}
  `
}

const getInstallMessage = () => {
  return platform === 'win32'
    ? getWindowsInstallMessage()
    : getLinuxInstallMessage()
}

addCommitComment({
  owner: 'cypress-io',
  repo: 'cypress',
  sha,
  comment: getInstallMessage(),
}).then(() => {
  console.log('Comment posted for commit %s ✅', sha)
})
