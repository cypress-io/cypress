require('@packages/coffee/register')

const la = require('lazy-ass')
const is = require('check-more-types')
const { getNameAndBinary, getJustVersion } = require('./utils')
const bump = require('./binary/bump')
const { stripIndent } = require('common-tags')
const os = require('os')
const minimist = require('minimist')

/* eslint-disable no-console */

const { npm, binary } = getNameAndBinary(process.argv)
la(is.unemptyString(npm), 'missing npm url')
la(is.unemptyString(binary), 'missing binary url')
const platform = os.platform()

console.log('bumping versions for other projects')
console.log('npm:', npm)
console.log('binary:', binary)
console.log('platform:', platform)

const cliOptions = minimist(process.argv, {
  string: 'provider',
  alias: {
    provider: 'p',
  },
})

const shorten = (s) =>
  s.substr(0, 7)

const getShortCommit = () => {
  const sha = process.env.APPVEYOR_REPO_COMMIT ||
    process.env.CIRCLE_SHA1 ||
    process.env.BUILDKITE_COMMIT
  if (sha) {
    return shorten(sha)
  }
}

bump.version(npm, binary, platform, cliOptions.provider)
  .then((result) => {
    console.log('bumped all test projects with new env variables')
    console.log(result)
    console.log('starting each test projects')
    la(is.unemptyString(result.versionName), 'missing versionName', result)
    la(is.unemptyString(result.binary), 'missing binary', result)

    const shortNpmVersion = getJustVersion(result.versionName)
    console.log('short NPM version', shortNpmVersion)

    let subject = `Testing new ${os.platform()} Cypress version ${shortNpmVersion}`
    const shortSha = getShortCommit()
    if (shortSha) {
      subject += ` ${shortSha}`
    }

    let message = stripIndent`
      ${subject}

      NPM package: ${result.versionName}
      Binary: ${result.binary}
    `
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

    console.log('commit message')
    console.log(message)
    return bump.run(message, cliOptions.provider)
  })
  .catch((e) => {
    console.error('could not bump test projects')
    console.error(e)
    process.exit(1)
  })
