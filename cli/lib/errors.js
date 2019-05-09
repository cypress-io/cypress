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

// common errors Cypress application can encounter
const failedDownload = {
  description: 'The Cypress App could not be downloaded.',
  solution: 'Please check network connectivity and try again:',
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
    description: `No version of Cypress is installed in: ${chalk.cyan(binaryDir)}`,
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
    description: 'The cypress npm package is installed, but the Cypress binary is missing.',
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

const isDisplayOnLinuxSet = () => {
  return os.platform() === 'linux' &&
  Boolean(process.env.DISPLAY)
}

const missingDependency = {
  description: 'Cypress failed to start.',
  // this message is too Linux specific
  solution: () => {
    let text = stripIndent`
      This is usually caused by a missing library or dependency.

      The error below should indicate which dependency is missing.

        ${chalk.blue(requiredDependenciesUrl)}

      If you are using Docker, we provide containers with all required dependencies installed.
    `

    if (isDisplayOnLinuxSet()) {
      const issueUrl = util.getGitHubIssueUrl(4034)

      text += `\n\n${stripIndent`
        We have noticed that DISPLAY variable is set to "${process.env.DISPLAY}"
        This might be a problem if X11 server is not responding.

          ${chalk.blue(issueUrl)}

        Try deleting the DISPLAY variable and running the command again.
      `}`
    }

    return text
  },
}

const invalidCacheDirectory = {
  description: 'Cypress cannot write to the cache directory due to file permissions',
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
  description: 'An unexpected error occurred while verifying the Cypress executable.',
  solution: stripIndent`
    Please search Cypress documentation for possible solutions:

      ${chalk.blue(docsUrl)}

    Check if there is a GitHub issue describing this crash:

      ${chalk.blue(util.issuesUrl)}

    Consider opening a new issue.
  `,
}

const removed = {
  CYPRESS_BINARY_VERSION: {
    description: stripIndent`
    The environment variable CYPRESS_BINARY_VERSION has been renamed to CYPRESS_INSTALL_BINARY as of version ${chalk.green('3.0.0')}
    `,
    solution: stripIndent`
    You should set CYPRESS_INSTALL_BINARY instead.
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
      description: `Could not run binary set by environment variable: CYPRESS_RUN_BINARY=${value}`,
      solution: `Ensure the environment variable is a path to the Cypress binary, matching ${properFormat}`,
    }
  },
}

function getPlatformInfo () {
  return util.getOsVersionAsync()
  .then((version) => {
    return stripIndent`
    Platform: ${os.platform()} (${version})
    Cypress Version: ${util.pkgVersion()}
  `
  })
}

function addPlatformInformation (info) {
  return getPlatformInfo()
  .then((platform) => {
    return merge(info, { platform })
  })
}

/**
 * Forms nice error message with error and platform information,
 * and if possible a way to solve it. Resolves with a string.
*/
function formErrorText (info, msg) {
  const hr = '----------'

  return addPlatformInformation(info)
  .then((obj) => {
    const formatted = []

    function add (msg) {
      formatted.push(
        stripIndents(msg)
      )
    }

    const solution = is.fn(obj.solution) ? obj.solution() : obj.solution

    la(is.unemptyString(solution), 'expected solution to be text', solution)

    add(`
      ${obj.description}

      ${solution}

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

    return formatted.join('\n\n')
  })
}

const raise = (text) => {
  const err = new Error(text)

  err.known = true
  throw err
}

const throwFormErrorText = (info) => {
  return (msg) => {
    return formErrorText(info, msg)
    .then(raise)
  }
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
    notInstalledCI,
    missingDependency,
    versionMismatch,
    binaryNotExecutable,
    unexpected,
    failedDownload,
    failedUnzip,
    invalidCacheDirectory,
    removed,
    CYPRESS_RUN_BINARY,
    smokeTestFailure,
  },
}
