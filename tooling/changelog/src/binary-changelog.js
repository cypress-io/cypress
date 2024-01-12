const fs = require('fs-extra')
const path = require('path')

const { createChangelog } = require('./create-changelog')
const { getCurrentReleaseData } = require('./semantic-commits/get-current-release-data')
const { getReleaseData } = require('./semantic-commits/get-binary-release-data')

const { deleteChangesets, parseChangesets } = require('./changeset')

const changelog = async () => {
  const changesets = await parseChangesets()

  console.log({ changesets })
  if (!changesets.length) {
    console.log('No changes. Nothing to release.')
    process.exit(0)
  }

  const latestReleaseInfo = await getCurrentReleaseData()
  const releaseData = await getReleaseData(latestReleaseInfo)

  const dirPath = path.join(path.sep, 'tmp', 'releaseData')

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }

  releaseData.changesets = changesets

  fs.writeFileSync(path.join(dirPath, 'releaseData.json'), JSON.stringify(releaseData, null, 2))

  console.log('')
  console.log('Release data saved to', path.join(dirPath, 'releaseData.json'))
  console.log('')

  const {
    nextVersion,
    changedFiles,
    commits,
  } = releaseData

  await createChangelog({
    nextVersion,
    changedFiles,
    commits,
    changesets,
  })

  console.log('Deleting all changesets for next release.')
  await deleteChangesets()
}

if (require.main !== module) {
  module.exports.changelog = changelog

  return
}

(async () => {
  await changelog()
})()
