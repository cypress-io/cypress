require('@packages/coffee/register')

const la = require('lazy-ass')
const is = require('check-more-types')
const { getNameAndBinary } = require('./utils')
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

    const message = stripIndent`
      Testing new Cypress version

      NPM package: ${result.versionName}
      Binary: ${result.binary}
      CircleCI job url: ${process.env.CIRCLE_BUILD_URL}
    `
    return bump.run(message)
  })
  .catch((e) => {
    console.error('could not bump test projects')
    console.error(e)
    process.exit(1)
  })
