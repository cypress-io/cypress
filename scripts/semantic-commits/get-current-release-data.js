/* eslint-disable no-console */
const execa = require('execa')

/**
 * Get the version, commit date and git sha of the latest tag published on npm.
 */
const getCurrentReleaseData = async (verbose = true) => {
  verbose && console.log('Get Current Release Information\n')
  const { stdout } = await execa('npm', ['info', 'cypress', '--json'])
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
