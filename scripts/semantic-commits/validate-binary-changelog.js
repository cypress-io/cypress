/* eslint-disable no-console */
const { validateChangelog } = require('./validate-changelog')
const { getCurrentReleaseData } = require('./get-current-release-data')
const { getReleaseData } = require('./get-binary-release-data')
const checkedInBinaryVersion = require('../../package.json').version

const changelog = async () => {
  const latestReleaseInfo = await getCurrentReleaseData()
  let hasVersionBump = !latestReleaseInfo.versions.includes(checkedInBinaryVersion)

  if (process.env.CIRCLECI) {
    console.log({ checkedInBinaryVersion })

    if (process.env.CIRCLE_BRANCH !== 'develop' && process.env.CIRCLE_BRANCH !== 'release-12.5.0' && !/^release\/\d+\.\d+\.\d+$/.test(process.env.CIRCLE_BRANCH) && !hasVersionBump) {
      console.log('Only verify the entire changelog for develop, a release branch or any branch that bumped to the Cypress version in the package.json.')

      return
    }
  }

  const {
    nextVersion,
    changedFiles,
    commits,
  } = await getReleaseData(latestReleaseInfo)

  console.log({ nextVersion })

  return validateChangelog({
    nextVersion,
    changedFiles,
    pendingRelease: !hasVersionBump,
    commits,
  })
}

if (require.main !== module) {
  module.exports.changelog = changelog

  return
}

(async () => {
  await changelog()
})()
