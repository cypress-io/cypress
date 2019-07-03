// this build utility script posts on the commit in the default branch "develop"
// telling the user how they can install pre-release build of the Test Runner

require('@packages/coffee/register')

const la = require('lazy-ass')
const is = require('check-more-types')
const os = require('os')
const { getNameAndBinary, getShortCommit, getCIName } = require('./utils')
const { addCommitComment } = require('@cypress/github-commit-status-check')
const { stripIndent } = require('common-tags')

/* eslint-disable no-console */

const { npm, binary } = getNameAndBinary(process.argv)
const { sha } = getShortCommit()

la(is.unemptyString(npm), 'missing npm url')
la(is.unemptyString(binary), 'missing binary url')
la(is.sha(sha), 'could not find commit SHA')

const platform = os.platform()
const arch = os.arch()

console.log('posting pre-release instructions')
console.log(' commit:', sha)
console.log(' npm:', npm)
console.log(' binary:', binary)
console.log(' platform:', platform)
console.log(' arch:', arch)

const ciName = getCIName() || 'unknown'
const instructionsAt =
  'https://on.cypress.io/installing-cypress#Install-pre-release-version'
const preamble = stripIndent`
  CI ${ciName} has built ${platform} ${arch} version of the Test Runner. You can install this pre-release platform-specific build using instructions at [${instructionsAt}](${instructionsAt}).

  You will need to use custom \`CYPRESS_INSTALL_BINARY\` url and \`cypress.tgz\` url instead of the version.
`

const getLinuxInstallMessage = () => {
  return stripIndent`
    ${preamble}

    \`\`\`
    export CYPRESS_INSTALL_BINARY=${binary}
    npm install ${binary}
    \`\`\`
  `
}

const getWindowsInstallMessage = () => {
  return stripIndent`
    ${preamble}

    \`\`\`
    set CYPRESS_INSTALL_BINARY=${binary}
    npm install ${binary}
    \`\`\`
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
})
