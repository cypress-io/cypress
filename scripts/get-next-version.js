/* eslint-disable no-console */

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

  let [major, minor, patch] = currentVersion.split('.').map(Number)

  switch (releaseType) {
    case 'major': major++; break
    case 'minor': minor++; break
    case 'patch': patch++; break
    default:
  }

  const nextVersion = [major, minor, patch].join('.')

  if (process.argv.includes('--npm')) {
    const cmd = `npm --no-git-tag-version version ${nextVersion}`

    console.log(`Running '${cmd}'...`)

    return require('child_process').execSync(cmd)
  }

  console.log(nextVersion)
})
