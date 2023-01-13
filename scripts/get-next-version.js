/* eslint-disable no-console */

// See ../guides/next-version.md for documentation.

const path = require('path')
const semver = require('semver')
const bumpCb = require('conventional-recommended-bump')
const { promisify } = require('util')

const currentVersion = require('../package.json').version
const { changeCatagories } = require('./semantic-commits/change-categories')
const bump = promisify(bumpCb)
const paths = ['packages', 'cli']

const getNextVersionForPath = async (path) => {
  // allow the semantic next version to be overridden by environment
  if (process.env.NEXT_VERSION) {
    return process.env.NEXT_VERSION
  }

  let commits
  const whatBump = (foundCommits) => {
    // semantic version bump: 0 - major, 1 - minor, 2 - patch
    let level = 2
    let breakings = 0
    let features = 0

    commits = foundCommits
    foundCommits.forEach((commit) => {
      if (changeCatagories[commit.type].release === 'major') {
        breakings += 1
        level = 0
      } else if (changeCatagories[commit.type].release === 'minor') {
        features += 1
        if (level === 2) {
          level = 1
        }
      }
    })

    return {
      level,
      reason: breakings > 0
        ? `There is ${breakings} BREAKING CHANGE and ${features} features`
        : features > 0 ? `There ${features} features` : 'There are only patch changes in this release',
    }
  }

  const { releaseType } = await bump({
    whatBump,
    path,
  })

  return {
    nextVersion: semver.inc(currentVersion, releaseType || 'patch'),
    commits,
  }
}

const getNextVersionForBinary = async () => {
  let commits = []
  let nextVersion

  for (const path of paths) {
    const { nextVersion: pathNextVersion, commits: pathCommits } = await getNextVersionForPath(path)

    if (!nextVersion || semver.gt(pathNextVersion, nextVersion)) {
      nextVersion = pathNextVersion
    }

    commits = commits.concat(pathCommits)
  }

  if (!nextVersion) {
    throw new Error('Unable to determine next version.')
  }

  return {
    nextVersion,
    commits,
  }
}

if (require.main !== module) {
  module.exports = {
    getNextVersionForBinary,
    getNextVersionForPath,
  }

  return
}

(async () => {
  process.chdir(path.join(__dirname, '..'))

  const { nextVersion } = await getNextVersionForBinary()

  if (process.argv.includes('--npm')) {
    const cmd = `npm --no-git-tag-version version ${nextVersion}`

    console.log(`Running '${cmd}'...`)

    return require('child_process').execSync(cmd)
  }

  console.log(nextVersion)
})()
