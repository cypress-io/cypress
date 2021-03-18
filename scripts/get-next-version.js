/* eslint-disable no-console */

const semver = require('semver')
const Bluebird = require('bluebird')
const bumpCb = require('conventional-recommended-bump')
const currentVersion = require('../package.json').version

const bump = Bluebird.promisify(bumpCb)
const paths = ['packages', 'cli']

// allow the semantic next version to be overridden by environment
let nextVersion = process.env.NEXT_VERSION

const getNextVersionForPath = async (path) => {
  const { releaseType } = await bump({ preset: 'angular', path })

  return semver.inc(currentVersion, releaseType || 'patch')
}

Bluebird.mapSeries(paths, async (path) => {
  const pathNextVersion = await getNextVersionForPath(path)

  if (!nextVersion || semver.gt(pathNextVersion, nextVersion)) {
    nextVersion = pathNextVersion
  }
})
.then(() => {
  if (!nextVersion) {
    throw new Error('Unable to determine next version.')
  }

  if (process.argv.includes('--npm')) {
    const cmd = `npm --no-git-tag-version version ${nextVersion}`

    console.log(`Running '${cmd}'...`)

    return require('child_process').execSync(cmd)
  }

  console.log(nextVersion)
})
