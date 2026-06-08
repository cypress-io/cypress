// Shared source of truth for the pinned Chrome versions in the CircleCI pipeline
// config. Used by both update-browser-versions.js (reads/writes the anchors) and
// generate-chrome-switches.mjs (derives the Chromium branch refs to scrape).
// chromium_flags_spec.ts mirrors readVersionAnchor/branchRefForVersion — it lives
// in a TypeScript package and can't import this CommonJS module without breaking
// check-ts, so keep the two in sync if this changes.

const fs = require('fs')
const path = require('path')

// the CircleCI pipeline config that holds the browser-version YAML anchors
const PIPELINE_CONFIG_PATH = path.join(__dirname, '../../.circleci/src/pipeline/@pipeline.yml')

const CHROME_STABLE_KEY = 'chrome-stable-version'
const CHROME_BETA_KEY = 'chrome-beta-version'
const CHROME_FOR_TESTING_STABLE_KEY = 'chrome-for-testing-stable-version'

// reads a `key: &anchor "MAJOR.MINOR.BUILD.PATCH"` anchor value from the config text
const readVersionAnchor = (config, key) => {
  const match = config.match(new RegExp(`${key}:\\s*&\\S+\\s*["'](\\d+\\.\\d+\\.\\d+\\.\\d+)["']`))

  if (!match) {
    throw new Error(`could not find ${key} in ${PIPELINE_CONFIG_PATH}`)
  }

  return match[1]
}

// Chrome `MAJOR.MINOR.BUILD.PATCH` -> Chromium release branch `refs/branch-heads/BUILD`
const branchRefForVersion = (version) => `refs/branch-heads/${version.split('.')[2]}`

// reads the pinned Chrome versions from the config (defaults to the committed file)
const readPinnedChromeVersions = (config = fs.readFileSync(PIPELINE_CONFIG_PATH, 'utf8')) => {
  return {
    stable: readVersionAnchor(config, CHROME_STABLE_KEY),
    stableCft: readVersionAnchor(config, CHROME_FOR_TESTING_STABLE_KEY),
    beta: readVersionAnchor(config, CHROME_BETA_KEY),
  }
}

module.exports = {
  PIPELINE_CONFIG_PATH,
  CHROME_STABLE_KEY,
  CHROME_BETA_KEY,
  CHROME_FOR_TESTING_STABLE_KEY,
  readVersionAnchor,
  branchRefForVersion,
  readPinnedChromeVersions,
}
