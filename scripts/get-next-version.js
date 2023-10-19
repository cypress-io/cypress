/* eslint-disable no-console */

// See ../guides/next-version.md for documentation.

const path = require('path')
const semver = require('semver')
const bumpCb = require('conventional-recommended-bump')
const { promisify } = require('util')
const minimist = require('minimist')

const currentVersion = require('../package.json').version

const bump = promisify(bumpCb)
const paths = ['packages', 'cli']

let nextVersion

const getNextVersionForPath = async (path) => {
  // allow the semantic next version to be overridden by environment
  if (process.env.NEXT_VERSION) {
    return process.env.NEXT_VERSION
  }

  const { releaseType } = await bump({ preset: 'angular', path })

  return semver.inc(currentVersion, releaseType || 'patch')
}

if (require.main !== module) {
  module.exports.getNextVersionForPath = getNextVersionForPath

  return
}

(async () => {
  process.chdir(path.join(__dirname, '..'))

  const args = minimist(process.argv.slice(2))

  const nextVersion = args.nextVersion

  if (args.npm && currentVersion !== nextVersion) {
    const cmd = `npm --no-git-tag-version version ${nextVersion}`

    console.log(`Running '${cmd}'...`)

    return require('child_process').execSync(cmd)
  }

  console.log(nextVersion)
})()
