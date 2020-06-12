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
const { html, stripIndent } = require('common-tags')

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
const instructionsAt =
  'https://on.cypress.io/installing-cypress#Install-pre-release-version'
const preamble = stripIndent`
  ${ciBuildLink} the \`${platform} ${arch}\` version of the Test Runner.

  You can install this pre-release platform-specific build using instructions at [${instructionsAt}](${instructionsAt}).

  You will need to use custom \`CYPRESS_INSTALL_BINARY\` url and install Cypress using an url instead of the version.
`

const getLinuxInstallMessage = () => {
  return stripIndent`
    ${preamble}

    export CYPRESS_INSTALL_BINARY=${binary}
    npm install ${npm}
  `
}

const getWindowsInstallMessage = () => {
  return html`
    ${preamble}

    Instructions are included below, depending on the shell you are using.

    #### In Command Prompt (\`cmd.exe\`):

        set CYPRESS_INSTALL_BINARY=${binary}
        npm install ${npm}

    #### In PowerShell:

        $env:CYPRESS_INSTALL_BINARY = ${binary}
        npm install ${npm}

    #### In Git Bash:

        export CYPRESS_INSTALL_BINARY=${binary}
        npm install ${npm}

    #### Using \`cross-env\`:

    If the above commands do not work for you, you can also try using \`cross-env\`:

        npm i -g cross-env
        cross-env CYPRESS_INSTALL_BINARY=${binary} npm install ${npm}
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
