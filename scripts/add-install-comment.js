// this build utility script posts on the commit in the default branch "develop"
// telling the user how they can install pre-release build of the Test Runner

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

const ciName = getCIName() || 'Unknown CI'
const buildUrl = getCIBuildUrl()
const ciBuildLink = buildUrl ? `[${ciName} has built](${buildUrl})` : `${ciName} has built`

const getInstallMessage = () => {
  return stripIndent`
    ${ciBuildLink} the \`${platform} ${arch}\` version of the Test Runner.

    Learn more about this pre-release platform-specific build at https://on.cypress.io/installing-cypress#Install-pre-release-version.

    Run this command to install the pre-release locally:

    \`\`\`
    npm install ${npm}
    \`\`\`
  `
}

addCommitComment({
  owner: 'cypress-io',
  repo: 'cypress',
  sha,
  comment: getInstallMessage(),
}).then(() => {
  console.log('Comment posted for commit %s ✅', sha)
})
