/* eslint-disable no-console */
const check = require('check-more-types')
const execa = require('execa')
const la = require('lazy-ass')
const Bluebird = require('bluebird')
const verifyNpmAuth = require('@semantic-release/npm/lib/verify-auth')
const { tmpdir } = require('os')
const path = require('path')
const fs = require('fs')
const { prepareReleaseArtifacts } = require('./prepare-release-artifacts')
const { getCurrentReleaseData } = require('../../semantic-commits/get-current-release-data')
const packageJson = require('../../../cli/package.json')

const publishDistributionToNPM = async (tgzPath, version, distTag, dryRun) => {
  const tmpDir = path.join(tmpdir(), 'dev-distribution')
  const npmrc = path.join(tmpDir, '.npmrc')

  try {
    await verifyNpmAuth(npmrc, packageJson, {
      cwd: process.cwd(),
      env: process.env,
      logger: console,
      stdout: process.stdout,
      stderr: process.stderr,
    })

    console.log(`\nPublishing ${version} to npm under ${distTag} tag`)

    const command = `npm publish ${tgzPath} --tag ${distTag} --userconfig ${npmrc} --registry https://registry.npmjs.org/`

    if (dryRun) {
      return execa(command.concat(' --dry-run'))
    }

    return execa(command)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

const getDistTags = async () => {
  const { distTags } = await getCurrentReleaseData(false)

  return distTags
}

// make this step retry-able with an incremental increase of in delay of retry attempt.
// Observed delays between publishing to npm to when this information has been updated.
const runWithRetry = async (promise) => {
  const delaysRemaining = [0, 1000, 3000, 6000]

  const poll = () => {
    return promise()
    .catch((err) => {
      console.log('poll err', err)
      const delay = delaysRemaining.shift()

      if (!delay) {
        throw err
      }

      console.warn(`Re-polling Cypress\'s distribution tags in ${delay} ms`)

      return Bluebird.delay(delay)
      .then(() => {
        return poll()
      })
    })
  }

  return poll()
}

const releaseDevDistribution = async (sha, nextVersion, dryRun = false) => {
  la(check.unemptyString(sha), 'missing sha to distribute')
  la(check.unemptyString(nextVersion), 'missing next version to distribute')

  console.log('Releasing Cypress Binary:\n')
  console.log('Next version:', nextVersion)

  const {
    latest: currentVersion,
    dev: devDistribution,
  } = await getDistTags()

  console.log('\nCurrent distribution information:')
  console.log('  - version:', currentVersion)
  console.log('  - latest distribution:', currentVersion)
  console.log('  - dev distribution:', devDistribution)
  console.log()

  if (currentVersion === nextVersion) {
    console.log('Provided version has already been released and tagged as latest.')

    return
  }

  if (devDistribution === nextVersion) {
    console.log('Provided version has already been released and tagged as dev.')

    return
  }

  return prepareReleaseArtifacts(sha, nextVersion, dryRun)
  .then((tgzPath) => {
    // publish dev distribution
    return publishDistributionToNPM(tgzPath, nextVersion, 'dev', dryRun)
  })
  .then(() => {
    const ensureDevDistribution = () => {
      return getDistTags()
      .then(({ latest, dev }) => {
        if (latest !== currentVersion) {
          throw new Error(`The latest distribution of ${latest} does not match the expected previous version of ${currentVersion}.`)
        }

        if (!dryRun && dev !== nextVersion) {
          throw new Error(`The dev distribution of ${dev} does not match the expected next version of ${nextVersion}.`)
        }

        console.log('\nUpdated distribution information')
        console.log('  - version:', currentVersion)
        console.log('  - latest distribution:', latest)
        console.log('  - dev distribution:', dev)
        console.log()
      })
    }

    return runWithRetry(ensureDevDistribution)
  })
}

module.exports = {
  releaseDevDistribution,
}
