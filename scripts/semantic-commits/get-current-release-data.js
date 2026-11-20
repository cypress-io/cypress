const childProcess = require('child_process')
const semver = require('semver')

const getYarnInfo = (pkg) => {
  const stdout = childProcess.execSync(`yarn info ${pkg} --json`)

  return JSON.parse(stdout).data
}

/**
 * The major of the nearest release tag reachable from HEAD, which tells a
 * previous-major maintenance branch (e.g. v15) apart from develop.
 */
const getBranchMajor = () => {
  try {
    // execFileSync skips the shell: cmd.exe on Windows would pass quotes around the pattern through to git
    const tag = childProcess.execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

    return semver.major(semver.coerce(tag))
  } catch (err) {
    return undefined
  }
}

const isAncestorOfHead = (sha) => {
  if (!/^[0-9a-f]{40}$/.test(sha)) return false

  try {
    childProcess.execFileSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD'], { stdio: 'ignore' })

    return true
  } catch (err) {
    return false
  }
}

/**
 * Get the version, commit date and git sha of the latest version published on
 * npm for the major line this branch is on.
 */
const getCurrentReleaseData = (verbose = true) => {
  verbose && console.log('Get Current Release Information\n')

  const npmInfo = getYarnInfo('cypress')
  const latestVersion = npmInfo['dist-tags'].latest

  let version = latestVersion
  let buildInfo = npmInfo.buildInfo
  let isPreviousMajor = false

  // checked before tags so an untagged current-major release still counts as this branch's line
  const branchMajor = isAncestorOfHead(buildInfo.commitSha) ? undefined : getBranchMajor()

  if (branchMajor !== undefined && branchMajor < semver.major(latestVersion)) {
    isPreviousMajor = true
    version = semver.maxSatisfying(npmInfo.versions, `${branchMajor}.x`)

    if (!version) {
      throw new Error(`No published cypress version found for major ${branchMajor}.`)
    }

    buildInfo = getYarnInfo(`cypress@${version}`).buildInfo
  }

  const latestReleaseInfo = {
    version,
    isPreviousMajor,
    distTags: npmInfo['dist-tags'],
    commitDate: buildInfo.commitDate,
    buildSha: buildInfo.commitSha,
  }

  verbose && console.log({ latestReleaseInfo })

  latestReleaseInfo.versions = npmInfo.versions

  return latestReleaseInfo
}

module.exports = {
  getCurrentReleaseData,
}
