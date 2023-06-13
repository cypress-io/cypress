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
const { Octokit } = require('@octokit/core')
const { createAppAuth } = require('@octokit/auth-app')
const { stripIndent } = require('common-tags')

const { npm, binary } = getNameAndBinary(process.argv)

la(is.unemptyString(npm), 'missing npm url')
la(is.unemptyString(binary), 'missing binary url')

const commitInfo = getShortCommit()

la(is.object(commitInfo), 'could not determine current commit information')
const { sha } = commitInfo

la(is.commitId(sha), 'could not find commit SHA')

const appId = process.env.GITHUB_APP_ID

la(appId, 'missing GITHUB_APP_ID')
const privateKey = process.env.GITHUB_PRIVATE_KEY

la(privateKey, 'missing GITHUB_PRIVATE_KEY')
const installationId = process.env.GITHUB_APP_CYPRESS_INSTALLATION_ID

la(installationId, 'missing GITHUB_APP_CYPRESS_INSTALLATION_ID')

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

    Learn more about this pre-release build at https://on.cypress.io/advanced-installation#Install-pre-release-version

    Run this command to install the pre-release locally:

    \`\`\`
    npm install ${npm}
    \`\`\`
  `
}

const appOctokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId,
    privateKey: Buffer.from(privateKey, 'base64').toString(),
    installationId,
  },
})

appOctokit.request(
  'POST /repos/{owner}/{repo}/commits/{commit_sha}/comments',
  {
    owner: 'cypress-io',
    repo: 'cypress',
    commit_sha: sha,
    body: getInstallMessage(),
  },
).then((response) => console.log(response))
