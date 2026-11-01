import chalk from 'chalk'
import { stripIndent, stripIndents } from 'common-tags'
import _ from 'lodash'
import assert from 'assert'
import util from './util'
import state from './tasks/state'

export const docsUrl = 'https://on.cypress.io'

const requiredDependenciesUrl = `${docsUrl}/required-dependencies`
const runDocumentationUrl = `${docsUrl}/cypress-run`

// TODO it would be nice if all error objects could be enforced via types
// to only have description + solution properties

const hr = '----------'

const genericErrorSolution = stripIndent`
  Search for an existing issue or open a GitHub issue at

    ${chalk.blue(util.issuesUrl)}
`

// common errors Cypress application can encounter
const unknownError = {
  description: 'Unknown Cypress CLI error',
  solution: genericErrorSolution,
}

const invalidRunProjectPath = {
  description: 'Invalid --project path',
  solution: stripIndent`
    Please provide a valid project path.

    Learn more about ${chalk.cyan('cypress run')} at:

      ${chalk.blue(runDocumentationUrl)}
  `,
}

const invalidOS = {
  description: 'The Cypress App could not be installed. Your machine does not meet the operating system requirements.',
  solution: stripIndent`

  ${chalk.blue('https://on.cypress.io/app/get-started/install-cypress#System-requirements')}`,
}

const failedDownload = {
  description: 'The Cypress App could not be downloaded.',
  solution: stripIndent`
  Does your workplace require a proxy to be used to access the Internet? If so, you must configure the HTTP_PROXY environment variable before downloading Cypress. Read more: https://on.cypress.io/proxy-configuration

  Otherwise, please check network connectivity and try again:`,
}

const failedUnzip = {
  description: 'The Cypress App could not be unzipped.',
  solution: genericErrorSolution,
}

const failedUnzipWindowsMaxPathLength = {
  description: 'The Cypress App could not be unzipped.',
  solution: `This is most likely because the maximum path length is being exceeded on your system.

  Read here for solutions to this problem: https://on.cypress.io/win-max-path-length-error`,
}

const missingApp = (binaryDir: string): any => {
  return {
    description: `No version of Cypress is installed in: ${chalk.cyan(
      binaryDir,
    )}`,
    solution: stripIndent`
    \nPlease reinstall Cypress by running: ${chalk.cyan('cypress install')}
  `,
  }
}

const binaryNotExecutable = (executable: string): any => {
  return {
    description: `Cypress cannot run because this binary file does not have executable permissions here:\n\n${executable}`,
    solution: stripIndent`\n
    Reasons this may happen:

    - node was installed as 'root' or with 'sudo'
    - the cypress npm package as 'root' or with 'sudo'

    Please check that you have the appropriate user permissions.

    You can also try clearing the cache with 'cypress cache clear' and reinstalling.
  `,
  }
}

const notInstalledCI = (executable: string): any => {
  return {
    description:
      'The cypress npm package is installed, but the Cypress binary is missing.',
    solution: stripIndent`\n
    We expected the binary to be installed here: ${chalk.cyan(executable)}

    Reasons it may be missing:

    - You're caching 'node_modules' but are not caching this path: ${state.getCacheDir()}
    - You ran 'npm install' at an earlier build step but did not persist: ${state.getCacheDir()}

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
    Install Xvfb and run Cypress again. On Debian and Ubuntu:

    ${chalk.cyan('apt-get install -y xvfb')}

    Or run Cypress on a display that already exists by setting the DISPLAY environment variable.

    Read our documentation on dependencies for more information:

      ${chalk.blue(requiredDependenciesUrl)}

    If you are using Docker, we provide containers with all required dependencies installed.
    `,
}

const xvfbFailedToStart = (timeoutSeconds: number) => {
  return {
    description: 'Xvfb is installed but could not start.',
    solution: stripIndent`
      Cypress could not start Xvfb, the virtual display it uses on Linux when DISPLAY is not set.

      Common causes:

      - The display number is already in use, for example by an Xvfb left running from an earlier run. Stop that Xvfb, or set the XVFB_DISPLAY_NUM environment variable to a free number.
      - Xvfb did not create its display within ${timeoutSeconds} seconds.
      - The Xvfb binary cannot be run by the user running Cypress, or that user cannot write to /tmp.

      Run Cypress again with DEBUG=cypress:xvfb to see what Xvfb printed.
      `,
  }
}

const smokeTestFailure = (smokeTestCommand: string, timedOut: boolean): any => {
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
  solution (msg?: string): string {
    return stripIndent`
      Cypress failed to start after spawning a new Xvfb server.

      The error logs we received were:

      ${hr}

      ${msg}

      ${hr}

      This may be due to a missing library or dependency. ${chalk.blue(requiredDependenciesUrl)}

      Please refer to the error above for more detail.
    `
  },
}

// Where each library the dynamic linker names comes from on Debian and Ubuntu
const APT_PACKAGES: Record<string, string> = {
  'libnss3.so': 'libnss3',
  'libgtk-3.so.0': 'libgtk-3-0',
  'libgbm.so.1': 'libgbm1',
  // The package was renamed in Debian 13 and Ubuntu 24.04, so the line falls back to the old name
  'libasound.so.2': 'libasound2t64 || apt-get install -y libasound2',
  'libXss.so.1': 'libxss1',
  'libXtst.so.6': 'libxtst6',
  'libX11-xcb.so.1': 'libx11-xcb1',
  'libxkbcommon.so.0': 'libxkbcommon0',
  'libatk-1.0.so.0': 'libatk1.0-0',
  'libatk-bridge-2.0.so.0': 'libatk-bridge2.0-0',
  'libcups.so.2': 'libcups2',
  'libdrm.so.2': 'libdrm2',
  'libnspr4.so': 'libnspr4',
  'libXcomposite.so.1': 'libxcomposite1',
  'libXdamage.so.1': 'libxdamage1',
  'libXrandr.so.2': 'libxrandr2',
  'libcairo.so.2': 'libcairo2',
  'libpango-1.0.so.0': 'libpango-1.0-0',
}

export const parseMissingLibraries = (output: string = ''): string[] => {
  const libraries = Array.from(output.matchAll(/error while loading shared libraries: ([^:\s]+):/g), (match) => match[1])

  return _.uniq(libraries)
}

const missingLibrariesSolution = (libraries: string[]): string => {
  const known = libraries.filter((library) => APT_PACKAGES[library])
  const unknown = libraries.filter((library) => !APT_PACKAGES[library])

  const lines = [
    `Cypress could not start because the system ${libraries.length === 1 ? 'library' : 'libraries'} below could not be loaded:`,
    '',
    ...libraries.map((library) => `  ${library}`),
  ]

  if (known.length) {
    lines.push('', 'On Debian and Ubuntu, install the packages that provide them:', '', ...known.map((library) => `  apt-get install -y ${APT_PACKAGES[library]}`))
  }

  if (unknown.length) {
    lines.push('', 'Find the package that provides each of these with apt-file, or your distribution\'s equivalent:', '', ...unknown.map((library) => `  apt-file search ${library}`))
  }

  lines.push('', `More about the required dependencies: ${chalk.blue(requiredDependenciesUrl)}`)

  return lines.join('\n')
}

const missingDependency = {
  description: 'Cypress failed to start.',
  // A function is given the error output, and when it is, it is responsible for printing it
  solution: (msg?: string) => {
    const libraries = parseMissingLibraries(msg)

    // this message is too Linux specific
    const advice = libraries.length ? missingLibrariesSolution(libraries) : stripIndent`
      This may be due to a missing library or dependency. ${chalk.blue(requiredDependenciesUrl)}
    `

    if (!msg) {
      return advice
    }

    return [advice, '', 'Please refer to the error below for more details.', '', hr, '', msg].join('\n')
  },
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

const incompatibleHeadlessFlags = {
  description: '`--headed` and `--headless` cannot both be passed.',
  solution: 'Either pass `--headed` or `--headless`, but not both.',
}

const solutionUnknown = stripIndent`
  Please search Cypress documentation for possible solutions:

    ${chalk.blue(docsUrl)}

  Check if there is a GitHub issue describing this crash:

    ${chalk.blue(util.issuesUrl)}

  Consider opening a new issue.
`
const unexpected = {
  description:
    'An unexpected error occurred while verifying the Cypress executable.',
  solution: solutionUnknown,
}

const invalidCypressEnv = {
  description:
    chalk.red('The environment variable with the reserved name "CYPRESS_INTERNAL_ENV" is set.'),
  solution: chalk.red('Unset the "CYPRESS_INTERNAL_ENV" environment variable and run Cypress again.'),
  exitCode: 11,
}

const invalidTestingType = {
  description: 'Invalid testingType',
  solution: `Please provide a valid testingType. Valid test types are ${chalk.cyan('\'e2e\'')} and ${chalk.cyan('\'component\'')}.`,
}

const incompatibleTestTypeFlags = {
  description: '`--e2e` and `--component` cannot both be passed.',
  solution: 'Either pass `--e2e` or `--component`, but not both.',
}

const incompatibleTestingTypeAndFlag = {
  description: 'Set a `testingType` and also passed `--e2e` or `--component` flags.',
  solution: 'Either set `testingType` or pass a testing type flag, but not both.',
}

const invalidConfigFile = {
  description: '`--config-file` cannot be false.',
  solution: 'Either pass a relative path to a valid Cypress config file or remove this option.',
}

const CYPRESS_RUN_BINARY = {
  notValid: (value: string): any => {
    const properFormat = `**/${state.getPlatformExecutable()}`

    return {
      description: `Could not run binary set by environment variable: CYPRESS_RUN_BINARY=${value}`,
      solution: `Ensure the environment variable is a path to the Cypress binary, matching ${properFormat}`,
    }
  },
}

/**
 * Given an error object (see the errors above), forms error message text with details,
 * then resolves with Error instance you can throw or reject with.
 * @param {object} errorObject
 * @returns {Promise<Error>} resolves with an Error
 * @example
  ```js
  // inside a Promise with "resolve" and "reject"
  const errorObject = errors.versionMismatch
  return getError(errorObject).then(reject)
  ```
 */
export async function getError (errorObject: any): Promise<Error> {
  const errorMessage = await formErrorText(errorObject)

  const err: any = new Error(errorMessage)

  err.known = true

  return err
}

/**
 * Forms nice error message with error and platform information,
 * and if possible a way to solve it. Resolves with a string.
 */
interface ErrorInfo {
  description: string
  solution: string | ((msg?: string, prevMessage?: string) => string)
  platform: string
  footer?: string
}

export async function formErrorText (info: Omit<ErrorInfo, 'platform'>, msg?: string, prevMessage?: string): Promise<string> {
  const platform = await util.getPlatformInfo()

  return syncFormErrorText({
    ...info,
    platform,
  }, msg, prevMessage)
}

function syncFormErrorText (info: ErrorInfo, msg?: string, prevMessage?: string): string {
  const formatted: string[] = []

  function add (msg: string): void {
    formatted.push(stripIndents(msg))
  }

  assert.ok(_.isString(info.description) && !_.isEmpty(info.description), 'expected error description to be text.')

  // assuming that if there the solution is a function it will handle
  // error message and (optional previous error message)
  if (_.isFunction(info.solution)) {
    const text = info.solution(msg, prevMessage)

    assert.ok(_.isString(text) && !_.isEmpty(text), 'expected solution to be text.')

    add(`
        ${info.description}

        ${text}

      `)
  } else {
    assert.ok(_.isString(info.solution) && !_.isEmpty(info.solution), 'expected error solution to be text.')

    add(`
        ${info.description}

        ${info.solution}

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

      ${info.platform}
    `)

  if (info.footer) {
    add(`

        ${hr}

        ${info.footer}
      `)
  }

  return formatted.join('\n\n')
}

const raise = (info: any) => {
  return (text: string) => {
    const err: any = new Error(text)

    if (info.code) {
      err.code = info.code
    }

    err.known = true
    throw err
  }
}

export const throwFormErrorText = (info: any) => {
  return async (msg?: string, prevMessage?: string) => {
    const errorText = await formErrorText(info, msg, prevMessage)

    raise(info)(errorText)
  }
}

/**
 * Forms full error message with error and OS details, prints to the error output
 * and then exits the process.
 * @param {ErrorInformation} info Error information {description, solution}
 * @example return exitWithError(errors.invalidCypressEnv)('foo')
 */
export const exitWithError = (info: any) => {
  return async (msg?: string) => {
    const text: string = await formErrorText(info, msg)

    console.error(text)
    process.exit(info.exitCode || 1)
  }
}

export const errors = {
  unknownError,
  nonZeroExitCodeXvfb,
  missingXvfb,
  xvfbFailedToStart,
  missingApp,
  notInstalledCI,
  missingDependency,
  invalidOS,
  invalidSmokeTestDisplayError,
  versionMismatch,
  binaryNotExecutable,
  unexpected,
  failedDownload,
  failedUnzip,
  failedUnzipWindowsMaxPathLength,
  invalidCypressEnv,
  invalidCacheDirectory,
  CYPRESS_RUN_BINARY,
  smokeTestFailure,
  incompatibleHeadlessFlags,
  invalidRunProjectPath,
  invalidTestingType,
  incompatibleTestTypeFlags,
  incompatibleTestingTypeAndFlag,
  invalidConfigFile,
}
