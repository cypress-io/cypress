const childProcess = require('child_process')

/**
 * Get the version, commit date and git sha of the latest tag published on npm.
 */
const getCurrentReleaseData = (verbose = true) => {
  verbose && console.log('Get Current Release Information\n')

  const stdout = childProcess.execSync('yarn info cypress --json')
  const { data: npmInfo } = JSON.parse(stdout)

  const latestReleaseInfo = {
    version: npmInfo['dist-tags'].latest,
    distTags: npmInfo['dist-tags'],
    commitDate: npmInfo.buildInfo.commitDate,
    buildSha: npmInfo.buildInfo.commitSha,
  }

  verbose && console.log({ latestReleaseInfo })

  latestReleaseInfo.versions = npmInfo.versions

  return latestReleaseInfo
}

module.exports = {
  getCurrentReleaseData,
}
