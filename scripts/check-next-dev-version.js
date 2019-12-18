/* eslint-disable no-console */
if (!process.env.NEXT_DEV_VERSION) {
  console.log('NEXT_DEV_VERSION is not set')
  process.exit(0)
}

const currentVersion = require('../package.json').version

if (currentVersion === process.env.NEXT_DEV_VERSION) {
  console.warn('⚠️ NEXT_DEV_VERSION is set to the same value as current package.json version "%s"', currentVersion)
  process.exit(0)
}

console.log('NEXT_DEV_VERSION is different from the current package version "%s"', currentVersion)
