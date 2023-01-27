/* eslint-disable no-console */
const childProcess = require('child_process')

/**
 * Get the version, commit date and git sha of the latest tag published on npm.
 */
const getCurrentReleaseData = (verbose = true) => {
  verbose && console.log('Get Current Release Information\n')

  const stdout = childProcess.execSync('npm info cypress --json')
  const npmInfo = JSON.parse(stdout)

  const latestReleaseInfo = {
    version: npmInfo['dist-tags'].latest,
    commitDate: npmInfo.buildInfo.commitDate,
    buildSha: npmInfo.buildInfo.commitSha,
  }

  verbose && console.log({ latestReleaseInfo })

  return latestReleaseInfo
}

module.exports = {
  getCurrentReleaseData,
}
