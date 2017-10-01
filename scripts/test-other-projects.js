require('@packages/coffee/register')

const la = require('lazy-ass')
const is = require('check-more-types')
const { getNameAndBinary } = require('./utils')
const bump = require('./binary/bump')

/* eslint-disable no-console */

const { npmUrl, binaryUrl } = getNameAndBinary(process.argv)
la(is.unemptyString(npmUrl), 'missing npm url')
la(is.unemptyString(binaryUrl), 'missing binary url')

bump.version(npmUrl, binaryUrl)
  .then(() => {
    console.log('bumped all test projects with new env variables')
    console.log('starting each test projects')
    return bump.run()
  })
  .catch((e) => {
    console.error('could not bump test projects')
    console.error(e)
    process.exit(1)
  })
