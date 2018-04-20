const os = require('os')
const chalk = require('chalk')
const Promise = require('bluebird')
const getos = Promise.promisify(require('getos'))
const { stripIndent, stripIndents } = require('common-tags')
const { merge } = require('ramda')

const util = require('./util')

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

const missingApp = {
  description: 'No version of Cypress is installed.',
  solution: stripIndent`
    \nPlease reinstall Cypress by running: ${chalk.cyan('cypress install')}
  `,
}

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

const invalidCypressEnv = {
  description: 'We have detected unknown or unsupported CYPRESS_ENV value',
  solution: 'Please unset CYPRESS_ENV variable and run Cypress again',
  exitCode: 11,
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

/**
 * Forms full error message with error and OS details, prints to the error output
 * and then exits the process.
 * @param {ErrorInformation} info Error information {description, solution}
 * @example return exitWithError(errors.invalidCypressEnv)('foo')
 */
const exitWithError = (info) => (msg) => {
  return formErrorText(info, msg).then((text) => {
    // eslint-disable-next-line no-console
    console.error(text)
    process.exit(info.exitCode || 1)
  })
}

module.exports = {
  raise,
  exitWithError,
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
    invalidCypressEnv,
  },
}
