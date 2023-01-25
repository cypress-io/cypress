/* eslint-disable no-console */
const { getBinaryVersion } = require('../npm-release')
const { validateChangelog } = require('./validate-changelog')
const { getCurrentReleaseData, getReleaseData } = require('./get-binary-release-data')

const changelog = async () => {
  const latestReleaseInfo = await getCurrentReleaseData()

  if (process.env.CIRCLECI) {
    const checkedInBinaryVersion = await getBinaryVersion()

    console.log({ checkedInBinaryVersion })

    const hasVersionBump = checkedInBinaryVersion !== latestReleaseInfo.version

    if (process.env.CIRCLE_BRANCH !== 'develop' || !/^release\/\d+\.\d+\.\d+$/.test(process.env.CIRCLE_BRANCH) || !hasVersionBump) {
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
