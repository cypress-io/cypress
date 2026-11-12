// Runs before anything is built, so this must not require workspace packages
require('../../packages/ts/register')

const { exec } = require('child_process')
const rp = require('@cypress/request-promise')
const { uploadArtifactToS3 } = require('./upload-build-artifact')

const checkIfBinaryExistsOnCdn = async (args = process.argv) => {
  console.log('#checkIfBinaryExistsOnCdn')

  const url = await uploadArtifactToS3([...args, '--dry-run', 'true'])

  console.log(`Checking if ${url} exists...`)

  const binaryExists = await rp.head(url)
  .then(() => true)
  .catch(() => false)

  if (binaryExists) {
    console.log('A binary was already built for this operating system and commit hash. Skipping binary build process...')
    exec('circleci-agent step halt', (_, __, stdout) => {
      console.log(stdout)
    })

    return
  }

  console.log('Binary does not yet exist. Continuing to build binary...')

  return binaryExists
}

module.exports = { checkIfBinaryExistsOnCdn }

if (!module.parent) {
  checkIfBinaryExistsOnCdn().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
