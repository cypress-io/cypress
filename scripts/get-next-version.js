/* eslint-disable no-console */

const semver = require('semver')

const fail = (...reason) => {
  console.error(...reason)
  process.exit(1)
}

const bump = require('conventional-recommended-bump')
const currentVersion = require('../package.json').version

bump({ preset: 'angular' }, (err, { releaseType }) => {
  if (err) {
    return fail('Error getting next version', err)
  }

  const nextVersion = semver.inc(currentVersion, releaseType || 'patch')

  if (process.argv.includes('--npm')) {
    const cmd = `npm --no-git-tag-version version ${nextVersion}`

    console.log(`Running '${cmd}'...`)

    return require('child_process').execSync(cmd)
  }

  console.log(nextVersion)
})
