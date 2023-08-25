const fs = require('fs')
const path = require('path')
const { validateChangelog } = require('./validate-changelog')
const { getCurrentReleaseData } = require('./get-current-release-data')
const { getReleaseData } = require('./get-binary-release-data')
const checkedInBinaryVersion = require('../../package.json').version

const changelog = async () => {
  const latestReleaseInfo = await getCurrentReleaseData()
  const hasVersionBump = !latestReleaseInfo.versions.includes(checkedInBinaryVersion) // account for branches behind develop

  if (process.env.CIRCLECI) {
    console.log({ checkedInBinaryVersion })

    if (process.env.CIRCLE_BRANCH !== 'develop' && process.env.CIRCLE_BRANCH !== 'add-skip-changelog-validation' && !/^release\/\d+\.\d+\.\d+$/.test(process.env.CIRCLE_BRANCH) && !hasVersionBump) {
      console.log('Only verify the entire changelog for develop, a release branch or any branch that bumped to the Cypress version in the package.json.')

      return
    }
  }

  const releaseData = await getReleaseData(latestReleaseInfo)

  const dirPath = path.join(path.sep, 'tmp', 'releaseData')

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }

  fs.writeFileSync(path.join(dirPath, 'releaseData.json'), JSON.stringify(releaseData, null, 2))

  console.log('Release data saved to', path.join(dirPath, 'releaseData.json'))

  const {
    nextVersion,
    changedFiles,
    commits,
  } = releaseData

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
