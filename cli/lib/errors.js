const os = require('os')
const chalk = require('chalk')
const { stripIndent, stripIndents } = require('common-tags')
const { merge } = require('ramda')
const la = require('lazy-ass')
const is = require('check-more-types')

const util = require('./util')
const state = require('./tasks/state')

const docsUrl = 'https://on.cypress.io'
const requiredDependenciesUrl = `${docsUrl}/required-dependencies`

// TODO it would be nice if all error objects could be enforced via types
// to only have description + solution properties

const hr = '----------'

// common errors Cypress application can encounter
const failedDownload = {
  description: 'The Cypress App could not be downloaded.',
  solution: stripIndent`
  Does your workplace require a proxy to be used to access the Internet? If so, you must configure the HTTP_PROXY environment variable before downloading Cypress. Read more: https://on.cypress.io/proxy-configuration

  Otherwise, please check network connectivity and try again:`,
}

const failedUnzip = {
  description: 'The Cypress App could not be unzipped.',
  solution: stripIndent`
    Search for an existing issue or open a GitHub issue at

      ${chalk.blue(util.issuesUrl)}
  `,
}

const missingApp = (binaryDir) => {
  return {
    description: `No version of Cypress is installed in: ${chalk.cyan(
      binaryDir
    )}`,
    solution: stripIndent`
    \nPlease reinstall Cypress by running: ${chalk.cyan('cypress install')}
  `,
  }
}

const binaryNotExecutable = (executable) => {
  return {
    description: `Cypress cannot run because this binary file does not have executable permissions here:\n\n${executable}`,
    solution: stripIndent`\n
    Reasons this may happen:

    - node was installed as 'root' or with 'sudo'
    - the cypress npm package as 'root' or with 'sudo'

    Please check that you have the appropriate user permissions.
  `,
  }
}

const notInstalledCI = (executable) => {
  return {
    description:
      'The cypress npm package is installed, but the Cypress binary is missing.',
    solution: stripIndent`\n
    We expected the binary to be installed here: ${chalk.cyan(executable)}

    Reasons it may be missing:

    - You're caching 'node_modules' but are not caching this path: ${util.getCacheDir()}
    - You ran 'npm install' at an earlier build step but did not persist: ${util.getCacheDir()}

    Properly caching the binary will fix this error and avoid downloading and unzipping Cypress.

    Alternatively, you can run 'cypress install' to download the binary again.

    ${chalk.blue('https://on.cypress.io/not-installed-ci-error')}
  `,
  }
}

const nonZeroExitCodeXvfb = {
  description: 'Xvfb exited with a non zero exit code.',
  solution: stripIndent`
    There was a problem spawning Xvfb.

    This is likely a problem with your system, permissions, or installation of Xvfb.
    `,
}

const missingXvfb = {
  description: 'Your system is missing the dependency: Xvfb',
  solution: stripIndent`
    Install Xvfb and run Cypress again.

    Read our documentation on dependencies for more information:

      ${chalk.blue(requiredDependenciesUrl)}

    If you are using Docker, we provide containers with all required dependencies installed.
    `,
}

const smokeTestFailure = (smokeTestCommand, timedOut) => {
  return {
    description: `Cypress verification ${timedOut ? 'timed out' : 'failed'}.`,
    solution: stripIndent`
    This command failed with the following output:

    ${smokeTestCommand}

    `,
  }
}

const invalidSmokeTestDisplayError = {
  code: 'INVALID_SMOKE_TEST_DISPLAY_ERROR',
  description: 'Cypress verification failed.',
  solution (msg) {
    return stripIndent`
      Cypress failed to start after spawning a new Xvfb server.

      The error logs we received were:

      ${hr}

      ${msg}

      ${hr}

      This is usually caused by a missing library or dependency.

      The error above should indicate which dependency is missing.

        ${chalk.blue(requiredDependenciesUrl)}

      If you are using Docker, we provide containers with all required dependencies installed.
    `
  },
}

const missingDependency = {
  description: 'Cypress failed to start.',
  // this message is too Linux specific
  solution: stripIndent`
    This is usually caused by a missing library or dependency.

    The error below should indicate which dependency is missing.

      ${chalk.blue(requiredDependenciesUrl)}

    If you are using Docker, we provide containers with all required dependencies installed.
  `,
}

const invalidCacheDirectory = {
  description:
    'Cypress cannot write to the cache directory due to file permissions',
  solution: stripIndent`
    See discussion and possible solutions at
    ${chalk.blue(util.getGitHubIssueUrl(1281))}
  `,
}

const versionMismatch = {
  description: 'Installed version does not match package version.',
  solution: 'Install Cypress and verify app again',
}

const unexpected = {
  description:
    'An unexpected error occurred while verifying the Cypress executable.',
  solution: stripIndent`
    Please search Cypress documentation for possible solutions:

      ${chalk.blue(docsUrl)}

    Check if there is a GitHub issue describing this crash:

      ${chalk.blue(util.issuesUrl)}

    Consider opening a new issue.
  `,
}

const invalidCypressEnv = {
  description:
    chalk.red('The environment variable with the reserved name "CYPRESS_ENV" is set.'),
  solution: chalk.red('Unset the "CYPRESS_ENV" environment variable and run Cypress again.'),
  exitCode: 11,
}

const removed = {
  CYPRESS_BINARY_VERSION: {
    description: stripIndent`
    The environment variable CYPRESS_BINARY_VERSION has been renamed to CYPRESS_INSTALL_BINARY as of version ${chalk.green(
    '3.0.0'
  )}
    `,
    solution: stripIndent`
    You should set CYPRESS_INSTALL_BINARY instead.
    `,
  },
  CYPRESS_SKIP_BINARY_INSTALL: {
    description: stripIndent`
    The environment variable CYPRESS_SKIP_BINARY_INSTALL has been removed as of version ${chalk.green(
    '3.0.0'
  )}
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
      description: `Could not run binary set by environment variable: CYPRESS_RUN_BINARY=${value}`,
      solution: `Ensure the environment variable is a path to the Cypress binary, matching ${properFormat}`,
    }
  },
}

function getPlatformInfo () {
  return util.getOsVersionAsync().then((version) => {
    return stripIndent`
    Platform: ${os.platform()} (${version})
    Cypress Version: ${util.pkgVersion()}
  `
  })
}

function addPlatformInformation (info) {
  return getPlatformInfo().then((platform) => {
    return merge(info, { platform })
  })
}

/**
 * Forms nice error message with error and platform information,
 * and if possible a way to solve it. Resolves with a string.
 */
function formErrorText (info, msg, prevMessage) {
  return addPlatformInformation(info).then((obj) => {
    const formatted = []

    function add (msg) {
      formatted.push(stripIndents(msg))
    }

    la(
      is.unemptyString(obj.description),
      'expected error description to be text',
      obj.description
    )

    // assuming that if there the solution is a function it will handle
    // error message and (optional previous error message)
    if (is.fn(obj.solution)) {
      const text = obj.solution(msg, prevMessage)

      la(is.unemptyString(text), 'expected solution to be text', text)

      add(`
        ${obj.description}

        ${text}

      `)
    } else {
      la(
        is.unemptyString(obj.solution),
        'expected error solution to be text',
        obj.solution
      )

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

    return formatted.join('\n\n')
  })
}

const raise = (info) => {
  return (text) => {
    const err = new Error(text)

    if (info.code) {
      err.code = info.code
    }

    err.known = true
    throw err
  }
}

const throwFormErrorText = (info) => {
  return (msg, prevMessage) => {
    return formErrorText(info, msg, prevMessage).then(raise(info))
  }
}

/**
 * Forms full error message with error and OS details, prints to the error output
 * and then exits the process.
 * @param {ErrorInformation} info Error information {description, solution}
 * @example return exitWithError(errors.invalidCypressEnv)('foo')
 */
const exitWithError = (info) => {
  return (msg) => {
    return formErrorText(info, msg).then((text) => {
      // eslint-disable-next-line no-console
      console.error(text)
      process.exit(info.exitCode || 1)
    })
  }
}

module.exports = {
  raise,
  exitWithError,
  // formError,
  formErrorText,
  throwFormErrorText,
  hr,
  errors: {
    nonZeroExitCodeXvfb,
    missingXvfb,
    missingApp,
    notInstalledCI,
    missingDependency,
    invalidSmokeTestDisplayError,
    versionMismatch,
    binaryNotExecutable,
    unexpected,
    failedDownload,
    failedUnzip,
    invalidCypressEnv,
    invalidCacheDirectory,
    removed,
    CYPRESS_RUN_BINARY,
    smokeTestFailure,
  },
}
