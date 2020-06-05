const la = require('lazy-ass')
const is = require('check-more-types')
const { getNameAndBinary, getJustVersion, getShortCommit } = require('./utils')
const bump = require('./binary/bump')
const { stripIndent } = require('common-tags')
const os = require('os')
const minimist = require('minimist')
const { getInstallJson } = require('@cypress/commit-message-install')

/* eslint-disable no-console */

const { npm, binary } = getNameAndBinary(process.argv)

la(is.unemptyString(npm), 'missing npm url')
la(is.unemptyString(binary), 'missing binary url')
const platform = os.platform()
const arch = os.arch()

console.log('bumping versions for other projects')
console.log(' npm:', npm)
console.log(' binary:', binary)
console.log(' platform:', platform)
console.log(' arch:', arch)

const cliOptions = minimist(process.argv, {
  string: 'provider',
  alias: {
    provider: 'p',
  },
})

/**
 * Returns given string surrounded by ```json + ``` quotes
 * @param {string} s
 */
const toJsonCodeBlock = (s) => {
  const start = '```json'
  const finish = '```'

  return `${start}\n${s}\n${finish}\n`
}

/**
 * Converts given JSON object into markdown text block
 * @param {object} object
 */
const toMarkdownJsonBlock = (object) => {
  la(object, 'expected an object to convert to JSON', object)
  const str = JSON.stringify(object, null, 2)

  return toJsonCodeBlock(str)
}

console.log('starting each test projects')

const shortNpmVersion = getJustVersion(npm)

console.log('short NPM version', shortNpmVersion)

let subject = `Testing new ${platform} ${arch} Cypress version ${shortNpmVersion}`
const commitInfo = getShortCommit()

if (commitInfo) {
  subject += ` ${commitInfo.short}`
}

// instructions for installing this binary,
// see "@cypress/commit-message-install"
const env = {
  CYPRESS_INSTALL_BINARY: binary,
}

const getStatusAndMessage = (projectRepoName) => {
  // also pass "status" object that points back at this repo and this commit
  // so that other projects can report their test success as GitHub commit status check
  let status = null
  const commit = commitInfo && commitInfo.sha

  if (commit && is.commitId(commit)) {
    // commit is full 40 character hex string
    const platform = os.platform()
    const arch = os.arch()

    status = {
      owner: 'cypress-io',
      repo: 'cypress',
      sha: commit,
      platform,
      arch,
      context: `[${platform}-${arch}] ${projectRepoName}`,
    }
  }

  const commitMessageInstructions = getInstallJson({
    packages: npm,
    env,
    platform,
    arch,
    branch: shortNpmVersion, // use as version as branch name on test projects
    commit,
    status,
  })
  const jsonBlock = toMarkdownJsonBlock(commitMessageInstructions)
  const footer =
    'Use tool `@cypress/commit-message-install` to install from above block'
  let message = `${subject}\n\n${jsonBlock}\n${footer}\n`

  if (process.env.CIRCLE_BUILD_URL) {
    message += '\n'
    message += stripIndent`
      CircleCI job url: ${process.env.CIRCLE_BUILD_URL}
    `
  }

  if (process.env.APPVEYOR) {
    const account = process.env.APPVEYOR_ACCOUNT_NAME
    const slug = process.env.APPVEYOR_PROJECT_SLUG
    const build = process.env.APPVEYOR_BUILD_NUMBER

    message += '\n'
    message += stripIndent`
      AppVeyor: ${account}/${slug} ${build}
    `
  }

  console.log('commit message:')
  console.log(message)

  return {
    status,
    message,
  }
}

const onError = (e) => {
  console.error('could not bump test projects')
  console.error(e)
  process.exit(1)
}

bump
.runTestProjects(
  getStatusAndMessage,
  cliOptions.provider,
  shortNpmVersion,
  platform,
)
.catch(onError)
