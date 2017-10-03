require('@packages/coffee/register')

const la = require('lazy-ass')
const is = require('check-more-types')
const { getNameAndBinary } = require('./utils')
const bump = require('./binary/bump')
const { stripIndent } = require('common-tags')

/* eslint-disable no-console */

const { npmUrl, binaryUrl } = getNameAndBinary(process.argv)
la(is.unemptyString(npmUrl), 'missing npm url')
la(is.unemptyString(binaryUrl), 'missing binary url')

bump.version(npmUrl, binaryUrl)
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
