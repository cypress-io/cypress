const fs = require('fs')
const path = require('path')
const { createChangelog } = require('./create-changelog')
const { getCurrentReleaseData } = require('./get-current-release-data')
const { getReleaseData } = require('./get-binary-release-data')

const changelog = async (changesets) => {
  const latestReleaseInfo = await getCurrentReleaseData()
  const releaseData = await getReleaseData(latestReleaseInfo)

  const dirPath = path.join(path.sep, 'tmp', 'releaseData')

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }

  releaseData.changesets = changesets

  fs.writeFileSync(path.join(dirPath, 'releaseData.json'), JSON.stringify(releaseData, null, 2))

  console.log('Release data saved to', path.join(dirPath, 'releaseData.json'))

  const {
    nextVersion,
    changedFiles,
    commits,
  } = releaseData

  return createChangelog({
    nextVersion,
    changedFiles,
    commits,
    changesets,
  })
}

if (require.main !== module) {
  module.exports.changelog = changelog

  return
}

(async () => {
  await changelog()
})()
