require('@packages/coffee/register')

const la = require('lazy-ass')
const is = require('check-more-types')
const { getNameAndBinary, getJustVersion } = require('./utils')
const bump = require('./binary/bump')
const { stripIndent } = require('common-tags')
const os = require('os')

/* eslint-disable no-console */

const { npm, binary } = getNameAndBinary(process.argv)
la(is.unemptyString(npm), 'missing npm url')
la(is.unemptyString(binary), 'missing binary url')
const platform = os.platform()

console.log('bumping versions for other projects')
console.log('npm:', npm)
console.log('binary:', binary)
console.log('platform:', platform)

bump.version(npm, binary, platform)
  .then((result) => {
    console.log('bumped all test projects with new env variables')
    console.log(result)
    console.log('starting each test projects')
    la(is.unemptyString(result.versionName), 'missing versionName', result)
    la(is.unemptyString(result.binary), 'missing binary', result)

    const shortNpmVersion = getJustVersion(result.versionName)
    console.log('short NPM version', shortNpmVersion)

    let message = stripIndent`
      Testing new Cypress version ${shortNpmVersion}

      NPM package: ${result.versionName}
      Binary: ${result.binary}
    `
    if (process.env.CIRCLE_BUILD_URL) {
      message += '\n'
      message += stripIndent`
        CircleCI job url: ${process.env.CIRCLE_BUILD_URL}
      `
    }
    console.log('commit message')
    console.log(message)
    return bump.run(message)
  })
  .catch((e) => {
    console.error('could not bump test projects')
    console.error(e)
    process.exit(1)
  })
