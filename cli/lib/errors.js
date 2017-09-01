const os = require('os')
const Promise = require('bluebird')
const getos = Promise.promisify(require('getos'))
const { stripIndent, stripIndents } = require('common-tags')
const { merge } = require('ramda')

const issuesUrl = 'https://github.com/cypress-io/cypress/issues'
const docsUrl = 'https://on.cypress.io'
const requiredDependenciesUrl = `${docsUrl}/required-dependencies`

// common errors Cypress application can encounter
const failedDownload = {
  description: 'The Cypress App could not be downloaded.',
  solution: 'Please check network connectivity and try again',
}

const failedToUnzip = {
  description: 'The Cypress App could not be unzipped.',
  solution: stripIndent`
    Search for an existing issue or open a GitHub issue at

      ${issuesUrl}
  `,
}

const missingApp = {
  description: 'No version of Cypress executable installed',
  solution: stripIndent`
    Please reinstall Cypress and run the app again.
    If the problem persists, search for an existing issue or open a GitHub issue at

      ${issuesUrl}
  `,
}

const missingXvfb = {
  description: 'Looks like your system is missing a must have dependency: XVFB',
  solution: stripIndent`
    Install XVFB and run Cypress again.
    Our CI documentation provides more information how to configure dependencies

      ${requiredDependenciesUrl}
  `,
}

const missingDependency = {
  description: 'Problem running Cypress application',
  // this message is too Linux specific
  solution: stripIndent`
    This is usually caused by a missing library or dependency.
    The error below should indicate which dependency is missing.
    Read our doc on CI dependencies for more information:

      ${requiredDependenciesUrl}
  `,
}

const versionMismatch = {
  description: 'Installed version does not match package version',
  solution: 'Install Cypress and verify app again',
}

const unexpected = {
  description: 'An unexpected error occurred while verifying the Cypress executable',
  solution: stripIndent`
    Please search Cypress documentation for possible solutions

      ${docsUrl}

    Find if there is a GitHub issue describing this crash

      ${issuesUrl}

    Consider opening a new issue, if you are the first to discover this
  `,
  printStack: true,
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
    Platform: ${os.platform()}
    Version: ${version}
  `)
}

function addPlatformInformation (info) {
  return getPlatformInfo()
  .then((platform) => merge(info, { platform }))
}

function formError (info, error) {
  return addPlatformInformation(info)
  .then((info) => merge(error, info))
}

function formErrorText (info, error) {
  const hr = '----------'
  return formError(info, error)
  .then((info) => stripIndents`
    ${hr}
    ${info.description}
    ${info.solution}
    ${hr}

    ${info.message}
    ${info.printStack ? info.stack : ''}
    ${hr}
    ${info.platform}
  `)
}

const raise = (text) => {
  throw new Error(text)
}

const throwDetailedError = (info) => (error) =>
  formErrorText(info, error)
  .then(raise)

module.exports = {
  formError,
  formErrorText,
  throwDetailedError,
  errors: {
    missingXvfb,
    missingApp,
    missingDependency,
    versionMismatch,
    unexpected,
    failedDownload,
    failedToUnzip,
  },
}
