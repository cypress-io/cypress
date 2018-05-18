const os = require('os')
const chalk = require('chalk')
const Promise = require('bluebird')
const getos = Promise.promisify(require('getos'))
const { stripIndent, stripIndents } = require('common-tags')
const { merge } = require('ramda')

const util = require('./util')
const state = require('./tasks/state')

const issuesUrl = 'https://github.com/cypress-io/cypress/issues'
const docsUrl = 'https://on.cypress.io'
const requiredDependenciesUrl = `${docsUrl}/required-dependencies`

// common errors Cypress application can encounter
const failedDownload = {
  description: 'The Cypress App could not be downloaded.',
  solution: 'Please check network connectivity and try again:',
}

const failedUnzip = {
  description: 'The Cypress App could not be unzipped.',
  solution: stripIndent`
    Search for an existing issue or open a GitHub issue at

      ${issuesUrl}
  `,
}

const missingApp = (binaryDir) => ({
  description: `No version of Cypress is installed in: ${chalk.cyan(binaryDir)}`,
  solution: stripIndent`
    \nPlease reinstall Cypress by running: ${chalk.cyan('cypress install')}
  `,
})

const nonZeroExitCodeXvfb = {
  description: 'XVFB exited with a non zero exit code.',
  solution: stripIndent`
    There was a problem spawning Xvfb.

    This is likely a problem with your system, permissions, or installation of Xvfb.
    `,
}

const missingXvfb = {
  description: 'Your system is missing the dependency: XVFB',
  solution: stripIndent`
    Install XVFB and run Cypress again.

    Read our documentation on dependencies for more information:

      ${requiredDependenciesUrl}

    If you are using Docker, we provide containers with all required dependencies installed.
    `,
}

const missingDependency = {
  description: 'Cypress failed to start.',
  // this message is too Linux specific
  solution: stripIndent`
    This is usually caused by a missing library or dependency.

    The error below should indicate which dependency is missing.

      ${requiredDependenciesUrl}

    If you are using Docker, we provide containers with all required dependencies installed.
  `,
}

const invalidCacheDirectory = {
  description: 'Cypress cannot write to the cache directory due to file permissions',
  solution: '',
}

const versionMismatch = {
  description: 'Installed version does not match package version.',
  solution: 'Install Cypress and verify app again',
}

const unexpected = {
  description: 'An unexpected error occurred while verifying the Cypress executable.',
  solution: stripIndent`
    Please search Cypress documentation for possible solutions:

      ${docsUrl}

    Check if there is a GitHub issue describing this crash:

      ${issuesUrl}

    Consider opening a new issue.
  `,
}

const removed = {
  CYPRESS_BINARY_VERSION: {
    description: stripIndent`
    The environment variable CYPRESS_BINARY_VERSION has been removed as of version ${chalk.green('3.0.0')}
    `,
    solution: stripIndent`
      You should use the equivalent environment variable CYPRESS_INSTALL_BINARY instead.
    `,
  },
  CYPRESS_SKIP_BINARY_INSTALL: {
    description: stripIndent`
    The environment variable CYPRESS_SKIP_BINARY_INSTALL has been removed as of version ${chalk.green('3.0.0')}
    `,
    solution: stripIndent`
      To skip the binary install, set CYPRESS_INSTALL_BINARY=0
    `,
  },
}

const CYPRESS_RUN_BINARY = {
  notValid: (value) => {
    const properFormat = `**/${state.getPlatformExecutable()}`
    return {
      description: `Could not run binary set by environment variable CYPRESS_RUN_BINARY=${value}`,
      solution: `Ensure the environment variable is a path to the Cypress binary, matching ${properFormat}`,
    }
  },
}

const getOsVersion = () => {
  if (os.platform() === 'linux') {
    return getos()
    .then((osInfo) => [osInfo.dist, osInfo.release].join(' - '))
    .catch(() => os.release())
  } else {
    return Promise.resolve(os.release())
  }
}

function getPlatformInfo () {
  return getOsVersion()
  .then((version) => stripIndent`
    Platform: ${os.platform()} (${version})
    Cypress Version: ${util.pkgVersion()}
  `)
}

function addPlatformInformation (info) {
  return getPlatformInfo()
  .then((platform) => merge(info, { platform }))
}

function formErrorText (info, msg) {
  const hr = '----------'

  return addPlatformInformation(info)
  .then((obj) => {
    const formatted = []

    function add (msg) {
      formatted.push(
        stripIndents`${msg}`
      )
    }

    add(`
      ${obj.description}

      ${obj.solution}

    `)

    if (msg) {
      add(`
        ${hr}

        ${msg}

      `)
    }

    add(`
      ${hr}

      ${obj.platform}
    `)

    if (obj.footer) {
      add(`

        ${hr}

        ${obj.footer}
      `)
    }

    return formatted.join('\n')
  })
}

const raise = (text) => {
  const err = new Error(text)
  err.known = true
  throw err
}

const throwFormErrorText = (info) => (msg) => {
  return formErrorText(info, msg)
  .then(raise)
}

module.exports = {
  raise,
  // formError,
  formErrorText,
  throwFormErrorText,
  errors: {
    nonZeroExitCodeXvfb,
    missingXvfb,
    missingApp,
    missingDependency,
    versionMismatch,
    unexpected,
    failedDownload,
    failedUnzip,
    invalidCacheDirectory,
    removed,
    CYPRESS_RUN_BINARY,
  },
}
