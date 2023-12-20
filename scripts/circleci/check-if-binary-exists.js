/**
 * To execute this script in CircleCI, install the following dependencies:
 *   - @cypress/request-promise
 *
 */
const { exec } = require('child_process')
const rp = require('@cypress/request-promise')
const { getNextVersionForBinary } = require('../get-next-version')
const { getBetaUploadPathUrl } = require('../binary/util/upload-path')

const checkIfBinaryExistsOnCdn = async () => {
  console.log('#checkIfBinaryExistsOnCdn')
  const { nextVersion } = await getNextVersionForBinary()

  const url = getBetaUploadPathUrl({
    type: 'binary',
    version: nextVersion,
  })

  console.log(`Checking if ${url} exists...`)

  return await rp.head(url)
  .then(() => {
    console.log('A binary was already built for this operating system and commit hash. Skipping binary build process...')

    exec('circleci-agent step halt', (_, __, stdout) => {
      console.log(stdout)
    })
  })
  .catch(() => {
    console.log('Binary does not yet exist. Continuing to build binary...')
  })
}

module.exports = checkIfBinaryExistsOnCdn

if (!module.parent) {
  checkIfBinaryExistsOnCdn(process.argv)
}
