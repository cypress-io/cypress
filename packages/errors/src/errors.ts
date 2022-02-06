import AU from 'ansi_up'
/* eslint-disable no-console */
import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'
import stripAnsi from 'strip-ansi'
import { humanTime, logError, pluralize } from './errorUtils'
import { backtick, errTemplate, fmt, guard, stackTrace } from './errTemplate'
import { stackWithoutMessage } from './stackUtils'
import { stripIndent } from './stripIndent'

import type { ClonedError, CypressError, ErrorLike, ErrTemplateResult } from './errorTypes'

const ansi_up = new AU()

ansi_up.use_classes = true

const displayRetriesRemaining = function (tries: number) {
  const times = tries === 1 ? 'time' : 'times'

  const lastTryNewLine = tries === 1 ? '\n' : ''

  return chalk.gray(
    `We will try connecting to it ${tries} more ${times}...${lastTryNewLine}`,
  )
}

export const warnIfExplicitCiBuildId = function (ciBuildId?: string | null) {
  if (!ciBuildId) {
    return ''
  }

  return `\
It also looks like you also passed in an explicit --ci-build-id flag.

This is only necessary if you are NOT running in one of our supported CI providers.

This flag must be unique for each new run, but must also be identical for each machine you are trying to --group or run in --parallel.\
`
}

/**
 * All Cypress Errors should be defined here:
 *
 * The errors must return an "errTemplate", this is processed by the
 */
export const AllCypressErrors = {
  CANNOT_TRASH_ASSETS: (arg1: string) => {
    return errTemplate`\
        Warning: We failed to trash the existing run results.

        This error will not alter the exit code.

        ${stackTrace(arg1)}`
  },
  CANNOT_REMOVE_OLD_BROWSER_PROFILES: (arg1: string) => {
    return errTemplate`\
        Warning: We failed to remove old browser profiles from previous runs.

        This error will not alter the exit code.

        ${stackTrace(arg1)}`
  },
  VIDEO_RECORDING_FAILED: (arg1: string) => {
    return errTemplate`\
        Warning: We failed to record the video.

        This error will not alter the exit code.

        ${stackTrace(arg1)}`
  },
  VIDEO_POST_PROCESSING_FAILED: (arg1: string) => {
    return errTemplate`\
        Warning: We failed processing this video.

        This error will not alter the exit code.

        ${stackTrace(arg1)}`
  },
  CHROME_WEB_SECURITY_NOT_SUPPORTED: (browser: string) => {
    return errTemplate`\
        Your project has set the configuration option: ${fmt.prop(`chromeWebSecurity`)} to ${fmt.value(`false`)}

        This option will not have an effect in ${guard(_.capitalize(browser))}. Tests that rely on web security being disabled will not run as expected.`
  },
  BROWSER_NOT_FOUND_BY_NAME: (browser: string, foundBrowsersStr: string[]) => {
    let canarySuffix = ''

    if (browser === 'canary') {
      canarySuffix += '\n\n'
      canarySuffix += stripIndent`\
          Note: In ${fmt.cypressVersion(`4.0.0`)}, Canary must be launched as ${chalk.magentaBright(`chrome:canary`)}, not ${chalk.magentaBright(`canary`)}.
_
          See https://on.cypress.io/migration-guide for more information on breaking changes in 4.0.0.`
    }

    return errTemplate`\
        Can't run because you've entered an invalid browser name.

        Browser: ${browser} was not found on your system or is not supported by Cypress.

        Cypress supports the following browsers:
        ${fmt.listItems(['electron', 'chrome', 'chromium', 'edge', 'firefox'])}

        You can also use a custom browser: https://on.cypress.io/customize-browsers

        Available browsers found on your system are:
        ${fmt.listItems(foundBrowsersStr)}${guard(canarySuffix)}`
  },
  BROWSER_NOT_FOUND_BY_PATH: (arg1: string, arg2: string) => {
    return errTemplate`\
        We could not identify a known browser at the path you provided: ${fmt.path(arg1)}

        The output from the command we ran was:

        ${stackTrace(arg2)}`
  },
  NOT_LOGGED_IN: () => {
    return errTemplate`\
        You're not logged in.

        Run ${`cypress open`} to open the Desktop App and log in.`
  },
  TESTS_DID_NOT_START_RETRYING: (arg1: string) => {
    return errTemplate`Timed out waiting for the browser to connect. ${guard(arg1)}`
  },
  TESTS_DID_NOT_START_FAILED: () => {
    return errTemplate`The browser never connected. Something is wrong. The tests cannot run. Aborting...`
  },
  DASHBOARD_CANCEL_SKIPPED_SPEC: () => {
    return errTemplate`${guard(`\n  `)}This spec and its tests were skipped because the run has been canceled.`
  },
  DASHBOARD_API_RESPONSE_FAILED_RETRYING: (arg1: {tries: number, delay: number, response: Error}) => {
    const time = pluralize('time', arg1.tries)
    const delay = humanTime.long(arg1.delay, false)

    return errTemplate`\
        We encountered an unexpected error talking to our servers.

        We will retry ${guard(arg1.tries)} more ${guard(time)} in ${guard(delay)}...

        The server's response was:

        ${arg1.response}`
    /* Because of fmt.listFlags() and fmt.listItems() */
    /* eslint-disable indent */
  },
  DASHBOARD_CANNOT_PROCEED_IN_PARALLEL: (arg1: {flags: any, response: Error}) => {
    return errTemplate`\
        We encountered an unexpected error talking to our servers.

        Because you passed the ${fmt.highlightSecondary(`--parallel`)} flag, this run cannot proceed because it requires a valid response from our servers.

        ${fmt.listFlags(arg1.flags, {
      group: '--group',
      ciBuildId: '--ciBuildId',
    })}

        The server's response was:

        ${arg1.response}`
  },
  DASHBOARD_CANNOT_PROCEED_IN_SERIAL: (arg1: {flags: any, response: Error}) => {
    return errTemplate`\
        We encountered an unexpected error talking to our servers.

        ${fmt.listFlags(arg1.flags, {
      group: '--group',
      ciBuildId: '--ciBuildId',
    })}

        The server's response was:

        ${arg1.response}`
  },
  DASHBOARD_UNKNOWN_INVALID_REQUEST: (arg1: {flags: any, response: Error}) => {
    return errTemplate`\
        We encountered an unexpected error talking to our servers.

        There is likely something wrong with the request.

        ${fmt.listFlags(arg1.flags, {
      tags: '--tag',
      group: '--group',
      parallel: '--parallel',
      ciBuildId: '--ciBuildId',
    })}

        The server's response was:

        ${arg1.response}`
  },
  // TODO: fix
  DASHBOARD_UNKNOWN_CREATE_RUN_WARNING: (arg1: {props: any, message: string}) => {
    return errTemplate`\
        Warning from Cypress Dashboard: ${arg1.message}

        Details:
        ${JSON.stringify(arg1.props, null, 2)}`
  },
  DASHBOARD_STALE_RUN: (arg1: {runUrl: string, [key: string]: any}) => {
    return errTemplate`\
        You are attempting to pass the ${fmt.highlightSecondary(`--parallel`)} flag to a run that was completed over 24 hours ago.

        The existing run is: ${fmt.url(arg1.runUrl)}

        You cannot parallelize a run that has been complete for that long.

        ${fmt.listFlags(arg1, {
      tags: '--tag',
      group: '--group',
      parallel: '--parallel',
      ciBuildId: '--ciBuildId',
    })}

        https://on.cypress.io/stale-run`
  },
  DASHBOARD_ALREADY_COMPLETE: (props: {runUrl: string}) => {
    return errTemplate`\
        The run you are attempting to access is already complete and will not accept new groups.

        The existing run is: ${fmt.url(props.runUrl)}

        When a run finishes all of its groups, it waits for a configurable set of time before finally completing. You must add more groups during that time period.

        ${fmt.listFlags(props, {
      tags: '--tag',
      group: '--group',
      parallel: '--parallel',
      ciBuildId: '--ciBuildId',
    })}

        https://on.cypress.io/already-complete`
  },
  DASHBOARD_PARALLEL_REQUIRED: (arg1: {runUrl: string}) => {
    return errTemplate`\
        You did not pass the ${fmt.highlightSecondary(`--parallel`)} flag, but this run's group was originally created with the --parallel flag.

        The existing run is: ${fmt.url(arg1.runUrl)}

        ${fmt.listFlags(arg1, {
      tags: '--tag',
      group: '--group',
      parallel: '--parallel',
      ciBuildId: '--ciBuildId',
    })}

        You must use the --parallel flag with this group.

        https://on.cypress.io/parallel-required`
  },
  DASHBOARD_PARALLEL_DISALLOWED: (arg1: {runUrl: string}) => {
    return errTemplate`\
        You passed the ${fmt.highlightSecondary(`--parallel`)} flag, but this run group was originally created without the --parallel flag.

        The existing run is: ${fmt.url(arg1.runUrl)}

        ${fmt.listFlags(arg1, {
      group: '--group',
      parallel: '--parallel',
      ciBuildId: '--ciBuildId',
    })}

        You can not use the --parallel flag with this group.

        https://on.cypress.io/parallel-disallowed`
  },
  DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH: (arg1: {runUrl: string, parameters: any}) => {
    return errTemplate`\
        You passed the ${fmt.highlightSecondary(`--parallel`)} flag, but we do not parallelize tests across different environments.

        This machine is sending different environment parameters than the first machine that started this parallel run.

        The existing run is: ${fmt.url(arg1.runUrl)}

        In order to run in parallel mode each machine must send identical environment parameters such as:

        ${fmt.listItems([
      'specs',
      'osName',
      'osVersion',
      'browserName',
      'browserVersion (major)',
    ])}

        This machine sent the following parameters:

        ${JSON.stringify(arg1.parameters, null, 2)}

        https://on.cypress.io/parallel-group-params-mismatch`
  },
  DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE: (arg1: {runUrl: string, ciBuildId?: string | null}) => {
    return errTemplate`\
        You passed the ${fmt.flag(`--group`)} flag, but this group name has already been used for this run.

        The existing run is: ${fmt.url(arg1.runUrl)}

        ${fmt.listFlags(arg1, {
      group: '--group',
      parallel: '--parallel',
      ciBuildId: '--ciBuildId',
    })}

        If you are trying to parallelize this run, then also pass the ${fmt.highlightSecondary(`--parallel`)} flag, else pass a different group name.

        ${warnIfExplicitCiBuildId(arg1.ciBuildId)}

        https://on.cypress.io/run-group-name-not-unique`
  },
  // TODO: fix
  DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS: () => {
    return errTemplate`\
      Deprecation Warning: The \`before:browser:launch\` plugin event changed its signature in version \`4.0.0\`

      The \`before:browser:launch\` plugin event switched from yielding the second argument as an \`array\` of browser arguments to an options \`object\` with an \`args\` property.

      We've detected that your code is still using the previous, deprecated interface signature.

      This code will not work in a future version of Cypress. Please see the upgrade guide: https://on.cypress.io/deprecated-before-browser-launch-args`
  },
  DUPLICATE_TASK_KEY: (arg1: string[]) => {
    return errTemplate`\
      Warning: Multiple attempts to register the following task(s):
      ${fmt.listItems(arg1, { color: fmt.highlight })}

      Only the last attempt will be registered.`
  },
  INDETERMINATE_CI_BUILD_ID: (arg1: Record<string, string>, arg2: string[]) => {
    return errTemplate`\
        You passed the ${fmt.flag(`--group`)} or ${fmt.flag(`--parallel`)} flag but we could not automatically determine or generate a ciBuildId.

        ${fmt.listFlags(arg1, {
      group: '--group',
      parallel: '--parallel',
    })}

        In order to use either of these features a ciBuildId must be determined.

        The ciBuildId is automatically detected if you are running Cypress in any of the these CI providers:

        ${fmt.listItems(arg2)}

        Because the ciBuildId could not be auto-detected you must pass the --ci-build-id flag manually.

        https://on.cypress.io/indeterminate-ci-build-id`
  },
  RECORD_PARAMS_WITHOUT_RECORDING: (arg1: Record<string, string>) => {
    return errTemplate`\
        You passed the ${fmt.flag(`--ci-build-id`)}, ${fmt.flag(`--group`)}, ${fmt.flag(`--tag`)}, or ${fmt.flag(`--parallel`)} flag without also passing the ${fmt.flag(`--record`)} flag.

        ${fmt.listFlags(arg1, {
      ciBuildId: '--ci-build-id',
      tags: '--tag',
      group: '--group',
      parallel: '--parallel',
    })}

        These flags can only be used when recording to the Cypress Dashboard service.

        https://on.cypress.io/record-params-without-recording`
  },
  INCORRECT_CI_BUILD_ID_USAGE: (arg1: Record<string, string>) => {
    return errTemplate`\
        You passed the ${fmt.flag(`--ci-build-id`)} flag but did not provide either a ${fmt.flag(`--group`)} or ${fmt.flag(`--parallel`)} flag.

        ${fmt.listFlags(arg1, {
      ciBuildId: '--ci-build-id',
    })}

        The --ci-build-id flag is used to either group or parallelize multiple runs together.

        https://on.cypress.io/incorrect-ci-build-id-usage`
    /* eslint-enable indent */
  },
  RECORD_KEY_MISSING: () => {
    return errTemplate`\
        You passed the ${fmt.flag(`--record`)} flag but did not provide us your Record Key.

        You can pass us your Record Key like this:

          ${fmt.terminal(`cypress run --record --key <record_key>`)}

        You can also set the key as an environment variable with the name CYPRESS_RECORD_KEY.

        https://on.cypress.io/how-do-i-record-runs`
  },
  CANNOT_RECORD_NO_PROJECT_ID: (configFilePath: string) => {
    return errTemplate`\
        You passed the ${fmt.flag(`--record`)} flag but this project has not been setup to record.

        This project is missing the ${`projectId`} inside of: ${fmt.path(configFilePath)}

        We cannot uniquely identify this project without this id.

        You need to setup this project to record. This will generate a unique projectId.

        Alternatively if you omit the ${fmt.flag(`--record`)} flag this project will run without recording.

        https://on.cypress.io/recording-project-runs`
  },
  PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION: (arg1: string) => {
    return errTemplate`\
        This project has been configured to record runs on our Dashboard.

        It currently has the projectId: ${arg1}

        You also provided your Record Key, but you did not pass the ${fmt.flag(`--record`)} flag.

        This run will not be recorded.

        If you meant to have this run recorded please additionally pass this flag:

          ${fmt.terminal('cypress run --record')}

        If you don't want to record these runs, you can silence this warning:

          ${fmt.terminal('cypress run --record false')}

        https://on.cypress.io/recording-project-runs`
  },
  // TODO: fix
  DASHBOARD_INVALID_RUN_REQUEST: (arg1: {message: string, errors: any, object: any}) => {
    return errTemplate`\
        Recording this run failed because the request was invalid.

        ${arg1.message}

        Errors:

        ${JSON.stringify(arg1.errors, null, 2)}

        Request Sent:

        ${JSON.stringify(arg1.object, null, 2)}`
  },
  // TODO: fix
  RECORDING_FROM_FORK_PR: () => {
    return errTemplate`\
        Warning: It looks like you are trying to record this run from a forked PR.

        The 'Record Key' is missing. Your CI provider is likely not passing private environment variables to builds from forks.

        These results will not be recorded.

        This error will not alter the exit code.`
  },
  DASHBOARD_CANNOT_UPLOAD_RESULTS: (apiErr: Error) => {
    return errTemplate`\
        Warning: We encountered an error while uploading results from your run.

        These results will not be recorded.

        This error will not alter the exit code.

        ${apiErr}`
  },
  DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE: (apiErr: Error) => {
    return errTemplate`\
        Warning: We encountered an error talking to our servers.

        This run will not be recorded.

        This error will not alter the exit code.

        ${apiErr}`
  },
  DASHBOARD_RECORD_KEY_NOT_VALID: (recordKey: string, projectId: string) => {
    return errTemplate`\
        Your Record Key ${recordKey} is not valid with this projectId: ${fmt.highlightSecondary(projectId)}

        It may have been recently revoked by you or another user.

        Please log into the Dashboard to see the valid record keys.

        https://on.cypress.io/dashboard/projects/${guard(projectId)}`
  },
  DASHBOARD_PROJECT_NOT_FOUND: (projectId: string, configFileBaseName: string) => {
    return errTemplate`\
        We could not find a Dashboard project with the projectId: ${projectId}

        This projectId came from your ${fmt.path(configFileBaseName)} file or an environment variable.

        Please log into the Dashboard and find your project.

        We will list the correct projectId in the 'Settings' tab.

        Alternatively, you can create a new project using the Desktop Application.

        https://on.cypress.io/dashboard`
  },
  NO_PROJECT_ID: (configFilePath: string) => {
    return errTemplate`Can't find ${`projectId`} in the config file: ${fmt.path(configFilePath)}`
  },
  NO_PROJECT_FOUND_AT_PROJECT_ROOT: (projectRoot: string) => {
    return errTemplate`Can't find a project at the path: ${fmt.path(projectRoot)}`
  },
  CANNOT_FETCH_PROJECT_TOKEN: () => {
    return errTemplate`Can't find project's secret key.`
  },
  CANNOT_CREATE_PROJECT_TOKEN: () => {
    return errTemplate`Can't create project's secret key.`
  },
  PORT_IN_USE_SHORT: (arg1: string | number) => {
    return errTemplate`Port ${arg1} is already in use.`
  },
  PORT_IN_USE_LONG: (arg1: string | number) => {
    return errTemplate`\
      Can't run project because port is currently in use: ${arg1}

      Assign a different port with the ${fmt.flag(`--port <port>`)} argument or shut down the other running process.')}`
  },
  ERROR_READING_FILE: (filePath: string, err: Error) => {
    return errTemplate`\
        Error reading from: ${fmt.path(filePath)}

        ${stackTrace(err)}`
  },
  ERROR_WRITING_FILE: (filePath: string, err: Error) => {
    return errTemplate`\
        Error writing to: ${fmt.path(filePath)}

        ${stackTrace(err)}`
  },
  NO_SPECS_FOUND: (folderPath: string, globPattern?: string | null) => {
    // no glob provided, searched all specs
    if (!globPattern) {
      return errTemplate`\
          Can't run because no spec files were found.

          We searched for any files inside of this folder:

          ${fmt.path(folderPath)}`
    }

    return errTemplate`\
        Can't run because no spec files were found.

        We searched for any files matching this glob pattern:

        ${path.join(fmt.path(folderPath), globPattern)}`
  },
  RENDERER_CRASHED: () => {
    return errTemplate`\
        We detected that the Chromium Renderer process just crashed.

        This is the equivalent to seeing the 'sad face' when Chrome dies.

        This can happen for a number of different reasons:

        - You wrote an endless loop and you must fix your own code
        - There is a memory leak in Cypress (unlikely but possible)
        - You are running Docker (there is an easy fix for this: see link below)
        - You are running lots of tests on a memory intense application
        - You are running in a memory starved VM environment
        - There are problems with your GPU / GPU drivers
        - There are browser bugs in Chromium

        You can learn more including how to fix Docker here:

        https://on.cypress.io/renderer-process-crashed`
  },
  AUTOMATION_SERVER_DISCONNECTED: () => {
    return errTemplate`The automation client disconnected. Cannot continue running tests.`
  },
  SUPPORT_FILE_NOT_FOUND: (supportFilePath: string) => {
    return errTemplate`\
        Your ${`supportFile`} file is missing or invalid: ${fmt.path(supportFilePath)}

        The supportFile must be a .js, .ts, .coffee file or be supported by your preprocessor plugin (if configured).

        Fix your support file, or set supportFile to ${fmt.highlightSecondary(`false`)} if a support file is not necessary for your project.

        If you have just renamed the extension of your supportFile, restart Cypress.

        Learn more at https://on.cypress.io/support-file-missing-or-invalid`
  },
  PLUGINS_FILE_ERROR: (pluginsFilePath: string, err: Error) => {
    return errTemplate`\
        Your ${`pluginsFile`} file is missing or invalid: ${fmt.path(pluginsFilePath)}

        It may have thrown an error when required, check the stack trace below.

        Fix your plugins file, or set pluginsFile to ${fmt.highlightSecondary(`false`)} if a plugins file is not necessary for your project.

        If you have just renamed the extension of your pluginsFile, restart Cypress.

        ${stackTrace(err)}
      `
  },
  // TODO: fix
  PLUGINS_DIDNT_EXPORT_FUNCTION: (arg1: string, arg2: any) => {
    return errTemplate`\
      The \`pluginsFile\` must export a function with the following signature:

      \`\`\`
      module.exports = function (on, config) {
        // configure plugins here
      }
      \`\`\`

      Learn more: https://on.cypress.io/plugins-api

      We loaded the \`pluginsFile\` from: ${arg1}

      It exported:

      ${stackTrace(arg2)}
    `
  },
  PLUGINS_FUNCTION_ERROR: (arg1: string, arg2: string | Error) => {
    return errTemplate`\
      The function exported by the plugins file threw an error: ${fmt.path(arg1)}

      ${stackTrace(arg2)}
    `
  },
  PLUGINS_UNEXPECTED_ERROR: (arg1: string, arg2: string | Error) => {
    return errTemplate`
      The following error was thrown by your plugins file: ${fmt.path(arg1)}

      We stopped running your tests because a plugin crashed.

      ${stackTrace(arg2)}
    `
  },
  PLUGINS_VALIDATION_ERROR: (arg1: string, arg2: string | Error) => {
    return errTemplate`
      The following validation error was thrown by your plugins file: ${fmt.path(arg1)}

      ${stackTrace(arg2)}
    `
  },
  // TODO: look at the listItem prefix
  BUNDLE_ERROR: (filePath: string, arg2: string) => {
    // IF YOU MODIFY THIS MAKE SURE TO UPDATE
    // THE ERROR MESSAGE IN THE RUNNER TOO
    return errTemplate`\
      Oops...we found an error preparing this test file:

        ${fmt.listItem(filePath, { prefix: '> ' })}

      The error was:

      ${chalk.yellow(arg2)}

      This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

      - A missing file or dependency
      - A syntax error in the file or one of its dependencies

      Fix the error in your code and re-run your tests.`
    // happens when there is an error in configuration file like "cypress.json"
  },
  // TODO: should this be basename or absolute path?
  // TODO: what should details be here? isn't it an error?
  SETTINGS_VALIDATION_ERROR: (configFileBaseName: string, errMessage: string) => {
    return errTemplate`\
        We found an invalid value in the file: ${fmt.path(configFileBaseName)}

        ${errMessage}`
    // happens when there is an invalid config value is returned from the
    // project's plugins file like "cypress/plugins.index.js"
  },
  // TODO: should this be relative or absolute?
  PLUGINS_CONFIG_VALIDATION_ERROR: (arg1: string, arg2: string) => {
    let filePath = `${arg1}`

    return errTemplate`\
        An invalid configuration value returned from the plugins file: ${fmt.path(filePath)}

        ${chalk.yellow(arg2)}`
    // general configuration error not-specific to configuration or plugins files
  },
  CONFIG_VALIDATION_ERROR: (arg1: string) => {
    return errTemplate`\
        We found an invalid configuration value:

        ${chalk.yellow(arg1)}`
  },
  RENAMED_CONFIG_OPTION: (arg1: {name: string, newName: string}) => {
    return errTemplate`\
        The ${arg1.name} configuration option you have supplied has been renamed.

        Please rename ${arg1.name} to ${fmt.highlightSecondary(arg1.newName)}`
  },
  CANNOT_CONNECT_BASE_URL: () => {
    return errTemplate`\
        Cypress failed to verify that your server is running.

        Please start this server and then run Cypress again.`
  },
  CANNOT_CONNECT_BASE_URL_WARNING: (arg1: string) => {
    return errTemplate`\
        Cypress could not verify that this server is running:

          ${fmt.listItem(arg1, { prefix: '> ' })}

        This server has been configured as your \`baseUrl\`, and tests will likely fail if it is not running.`
  },
  CANNOT_CONNECT_BASE_URL_RETRYING: (arg1: {attempt: number, baseUrl: string, remaining: number, delay: number}) => {
    switch (arg1.attempt) {
      case 1:
        return errTemplate`\
            Cypress could not verify that this server is running:

              > ${chalk.blue(arg1.baseUrl)}

            We are verifying this server because it has been configured as your \`baseUrl\`.

            Cypress automatically waits until your server is accessible before running tests.

            ${displayRetriesRemaining(arg1.remaining)}`
      default:
        return errTemplate`${guard(displayRetriesRemaining(arg1.remaining))}`
    }
  },
  INVALID_REPORTER_NAME: (arg1: {name: string, paths: string[], error: string}) => {
    return errTemplate`\
        Could not load reporter by name: ${chalk.yellow(arg1.name)}

        We searched for the reporter in these paths:

        ${fmt.listItems(arg1.paths)}

        The error we received was:

        ${chalk.yellow(arg1.error)}

        Learn more at https://on.cypress.io/reporters`
    // TODO: update with vetted cypress language
  },
  NO_DEFAULT_CONFIG_FILE_FOUND: (arg1: string) => {
    return errTemplate`\
        Could not find a Cypress configuration file, exiting.

        We looked but did not find a default config file in this folder: ${fmt.path(arg1)}`
    // TODO: update with vetted cypress language
  },
  // TODO: verify these are configBaseName and not configPath
  CONFIG_FILES_LANGUAGE_CONFLICT: (projectRoot: string, configFileBaseName1: string, configFileBaseName2: string) => {
    return errTemplate`
          There is both a ${configFileBaseName1} and a ${configFileBaseName2} at the location below:

            ${fmt.listItem(projectRoot, { prefix: '> ' })}

          Cypress does not know which one to read for config. Please remove one of the two and try again.
          `
  },
  CONFIG_FILE_NOT_FOUND: (configFileBaseName: string, projectRoot: string) => {
    return errTemplate`\
        Could not find a Cypress configuration file, exiting.

        We looked but did not find a ${fmt.path(configFileBaseName)} file in this folder: ${fmt.path(projectRoot)}`
  },
  INVOKED_BINARY_OUTSIDE_NPM_MODULE: () => {
    return errTemplate`\
        It looks like you are running the Cypress binary directly.

        This is not the recommended approach, and Cypress may not work correctly.

        Please install the ${`cypress`} NPM package and follow the instructions here:

        https://on.cypress.io/installing-cypress`
  },
  FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS: (arg1: {link: string, planType: string, usedTestsMessage: string}) => {
    return errTemplate`\
        You've exceeded the limit of private test results under your free plan this month. ${arg1.usedTestsMessage}

        To continue recording tests this month you must upgrade your account. Please visit your billing to upgrade to another billing plan.

        ${guard(arg1.link)}`
  },
  FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS: (arg1: {link: string, planType: string, usedTestsMessage: string, gracePeriodMessage: string}) => {
    return errTemplate`\
        You've exceeded the limit of private test results under your free plan this month. ${arg1.usedTestsMessage}

        Your plan is now in a grace period, which means your tests will still be recorded until ${arg1.gracePeriodMessage}. Please upgrade your plan to continue recording tests on the Cypress Dashboard in the future.

        ${guard(arg1.link)}`
  },
  PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS: (arg1: {link: string, planType: string, usedTestsMessage: string}) => {
    return errTemplate`\
        You've exceeded the limit of private test results under your current billing plan this month. ${arg1.usedTestsMessage}

        To upgrade your account, please visit your billing to upgrade to another billing plan.

        ${guard(arg1.link)}`
  },
  FREE_PLAN_EXCEEDS_MONTHLY_TESTS: (arg1: {link: string, planType: string, usedTestsMessage: string}) => {
    return errTemplate`\
        You've exceeded the limit of test results under your free plan this month. ${arg1.usedTestsMessage}

        To continue recording tests this month you must upgrade your account. Please visit your billing to upgrade to another billing plan.

        ${guard(arg1.link)}`
  },
  FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS: (arg1: {link: string, planType: string, usedTestsMessage: string, gracePeriodMessage: string}) => {
    return errTemplate`\
        You've exceeded the limit of test results under your free plan this month. ${arg1.usedTestsMessage}

        Your plan is now in a grace period, which means you will have the full benefits of your current plan until ${arg1.gracePeriodMessage}.

        Please visit your billing to upgrade your plan.

        ${guard(arg1.link)}`
  },
  PLAN_EXCEEDS_MONTHLY_TESTS: (arg1: {link: string, planType: string, usedTestsMessage: string}) => {
    return errTemplate`\
        You've exceeded the limit of test results under your ${arg1.planType} billing plan this month. ${arg1.usedTestsMessage}

        To continue getting the full benefits of your current plan, please visit your billing to upgrade.

        ${guard(arg1.link)}`
  },
  FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE: (arg1: {link: string, gracePeriodMessage: string}) => {
    return errTemplate`\
        Parallelization is not included under your free plan.

        Your plan is now in a grace period, which means your tests will still run in parallel until ${arg1.gracePeriodMessage}. Please upgrade your plan to continue running your tests in parallel in the future.

        ${guard(arg1.link)}`
  },
  PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN: (arg1: {link: string}) => {
    return errTemplate`\
        Parallelization is not included under your current billing plan.

        To run your tests in parallel, please visit your billing and upgrade to another plan with parallelization.

        ${guard(arg1.link)}`
  },
  PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED: (arg1: {link: string, gracePeriodMessage: string}) => {
    return errTemplate`\
        Grouping is not included under your free plan.

        Your plan is now in a grace period, which means your tests will still run with groups until ${arg1.gracePeriodMessage}. Please upgrade your plan to continue running your tests with groups in the future.

        ${guard(arg1.link)}`
  },
  RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN: (arg1: {link: string}) => {
    return errTemplate`\
        Grouping is not included under your current billing plan.

        To run your tests with groups, please visit your billing and upgrade to another plan with grouping.

        ${guard(arg1.link)}`
  },
  FIXTURE_NOT_FOUND: (arg1: string, arg2: string[]) => {
    return errTemplate`\
        A fixture file could not be found at any of the following paths:

        > ${arg1}
        > ${arg1}.[ext]

        Cypress looked for these file extensions at the provided path:

        > ${arg2.join(', ')}

        Provide a path to an existing fixture file.`
  },
  AUTH_COULD_NOT_LAUNCH_BROWSER: (loginUrl: string) => {
    return errTemplate`\
      Cypress was unable to open your installed browser. To continue logging in, please open this URL in your web browser:

      ${fmt.url(loginUrl)}`
  },
  AUTH_BROWSER_LAUNCHED: () => {
    return errTemplate`Check your browser to continue logging in.`
  },
  BAD_POLICY_WARNING: (policyKeys: string[]) => {
    return errTemplate`\
        Cypress detected policy settings on your computer that may cause issues.

        The following policies were detected that may prevent Cypress from automating Chrome:

        ${fmt.listItems(policyKeys)}

        For more information, see https://on.cypress.io/bad-browser-policy`
  },
  BAD_POLICY_WARNING_TOOLTIP: () => {
    return errTemplate`Cypress detected policy settings on your computer that may cause issues with using this browser. For more information, see https://on.cypress.io/bad-browser-policy`
  },
  EXTENSION_NOT_LOADED: (browserName: string, extensionPath: string) => {
    return errTemplate`\
        ${guard(browserName)} could not install the extension at path: ${fmt.path(extensionPath)}

        Please verify that this is the path to a valid, unpacked WebExtension.`
  },
  COULD_NOT_FIND_SYSTEM_NODE: (nodeVersion: string) => {
    return errTemplate`\
        ${fmt.prop(`nodeVersion`)} is set to ${fmt.value(`system`)}, but Cypress could not find a usable Node executable on your PATH.

        Make sure that your Node executable exists and can be run by the current user.

        Cypress will use the built-in Node version ${fmt.highlightSecondary(nodeVersion)} instead.`
  },
  INVALID_CYPRESS_INTERNAL_ENV: (val: string) => {
    return errTemplate`\
        We have detected an unknown or unsupported "CYPRESS_INTERNAL_ENV" value

          ${fmt.listItem(val, { prefix: '> ' })}

        "CYPRESS_INTERNAL_ENV" is reserved and should only be used internally.

        Do not modify the "CYPRESS_INTERNAL_ENV" value.`
  },
  CDP_VERSION_TOO_OLD: (arg1: string, arg2: {major: number, minor: string | number}) => {
    return errTemplate`A minimum CDP version of v${guard(arg1)} is required, but the current browser has ${guard(arg2.major !== 0 ? `v${arg2.major}.${arg2.minor}` : 'an older version')}.`
  },
  CDP_COULD_NOT_CONNECT: (arg1: string, arg2: string, arg3: Error) => {
    return errTemplate`\
        Cypress failed to make a connection to the Chrome DevTools Protocol after retrying for 50 seconds.

        This usually indicates there was a problem opening the ${guard(arg1)} browser.

        The CDP port requested was ${guard(chalk.yellow(arg2))}.

        Error stackTrace:

        ${stackTrace(arg3)}`
  },
  FIREFOX_COULD_NOT_CONNECT: (arg1: Error) => {
    return errTemplate`\
        Cypress failed to make a connection to Firefox.

        This usually indicates there was a problem opening the Firefox browser.

        Error stackTrace:

        ${stackTrace(arg1)}`
  },
  CDP_COULD_NOT_RECONNECT: (arg1: Error) => {
    return errTemplate`\
        There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.

        ${stackTrace(arg1)}`
  },
  CDP_RETRYING_CONNECTION: (attempt: string | number, browserType: string) => {
    return errTemplate`Still waiting to connect to ${guard(browserType)}, retrying in 1 second (attempt ${chalk.yellow(`${attempt}`)}/62)`
  },
  UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES: (arg1: string[], arg2: string[]) => {
    return errTemplate`\
        The ${`launchOptions`} object returned by your plugin's ${fmt.highlightSecondary(`before:browser:launch`)} handler contained unexpected properties:

        ${fmt.listItems(arg1)}

        launchOptions may only contain the properties:

        ${fmt.listItems(arg2)}

        https://on.cypress.io/browser-launch-api`
  },
  COULD_NOT_PARSE_ARGUMENTS: (arg1: string, arg2: string, arg3: string) => {
    return errTemplate`\
        Cypress encountered an error while parsing the argument ${chalk.gray(arg1)}

        You passed: ${arg2}

        The error was: ${arg3}`
  },
  FIREFOX_MARIONETTE_FAILURE: (arg1: string, arg2: Error) => {
    return errTemplate`\
        Cypress could not connect to Firefox.

        An unexpected error was received from Marionette ${guard(arg1)}

        To avoid this error, ensure that there are no other instances of Firefox launched by Cypress running.

        ${stackTrace(arg2)}`
  },
  FOLDER_NOT_WRITABLE: (arg1: string) => {
    return errTemplate`\
        Folder ${fmt.path(arg1)} is not writable.

        Writing to this directory is required by Cypress in order to store screenshots and videos.

        Enable write permissions to this directory to ensure screenshots and videos are stored.

        If you don't require screenshots or videos to be stored you can safely ignore this warning.`
  },
  EXPERIMENTAL_SAMESITE_REMOVED: () => {
    return errTemplate`\
        The ${`experimentalGetCookiesSameSite`} configuration option was removed in ${fmt.cypressVersion(`5.0.0`)}. Yielding the ${fmt.highlightSecondary(`sameSite`)} property is now the default behavior of the ${fmt.highlightSecondary(`cy.cookie`)} commands.

        You can safely remove this option from your config.`
  },
  // TODO: verify configFile is absolute path
  EXPERIMENTAL_COMPONENT_TESTING_REMOVED: (arg1: {configFile: string}) => {
    return errTemplate`\
        The ${'experimentalComponentTesting'} configuration option was removed in ${fmt.cypressVersion(`7.0.0`)}.

        Please remove this flag from: ${fmt.path(arg1.configFile)}

        Cypress Component Testing is now a standalone command. You can now run your component tests with:

          ${fmt.terminal(`cypress open-ct`)}

        https://on.cypress.io/migration-guide`
  },
  EXPERIMENTAL_SHADOW_DOM_REMOVED: () => {
    return errTemplate`\
        The ${`experimentalShadowDomSupport`} configuration option was removed in ${fmt.cypressVersion(`5.2.0`)}. It is no longer necessary when utilizing the ${fmt.highlightSecondary(`includeShadowDom`)} option.

        You can safely remove this option from your config.`
  },
  EXPERIMENTAL_NETWORK_STUBBING_REMOVED: () => {
    return errTemplate`\
        The ${`experimentalNetworkStubbing`} configuration option was removed in ${fmt.cypressVersion(`6.0.0`)}.

        It is no longer necessary for using ${fmt.highlightSecondary(`cy.intercept()`)}. You can safely remove this option from your config.`
  },
  EXPERIMENTAL_RUN_EVENTS_REMOVED: () => {
    return errTemplate`\
        The ${`experimentalRunEvents`} configuration option was removed in ${fmt.cypressVersion(`6.7.0`)}. It is no longer necessary when listening to run events in the plugins file.

        You can safely remove this option from your config.`
  },
  FIREFOX_GC_INTERVAL_REMOVED: () => {
    return errTemplate`\
        The ${`firefoxGcInterval`} configuration option was removed in ${fmt.cypressVersion(`8.0.0`)}. It was introduced to work around a bug in Firefox 79 and below.

        Since Cypress no longer supports Firefox 85 and below in Cypress 8, this option was removed.

        You can safely remove this option from your config.`
  },
  INCOMPATIBLE_PLUGIN_RETRIES: (arg1: string) => {
    return errTemplate`\
      We've detected that the incompatible plugin ${`cypress-plugin-retries`} is installed at ${fmt.path(arg1)}.

      Test retries is now supported in ${fmt.cypressVersion(`5.0.0`)}.

      Remove the plugin from your dependencies to silence this warning.

      https://on.cypress.io/test-retries
      `
  },
  INVALID_CONFIG_OPTION: (arg1: string[]) => {
    const phrase = arg1.length > 1 ? 'options are' : 'option is'

    return errTemplate`\
        The following configuration ${guard(phrase)} invalid:
        ${fmt.listItems(arg1)}

        https://on.cypress.io/configuration
        `
  },
  PLUGINS_RUN_EVENT_ERROR: (arg1: string, arg2: Error) => {
    return errTemplate`\
        An error was thrown in your plugins file while executing the handler for the ${arg1} event.

        The error we received was:

        ${stackTrace(arg2)}`
  },
  CT_NO_DEV_START_EVENT: (arg1: string) => {
    const pluginsFilePath = arg1 ?
      stripIndent`\
      You can find the \'pluginsFile\' at the following path:

      ${arg1}
      ` : ''

    return errTemplate`\
        To run component-testing, cypress needs the \`dev-server:start\` event.

        Implement it by adding a \`on('dev-server:start', () => startDevServer())\` call in your pluginsFile.
        ${pluginsFilePath}
        Learn how to set up component testing:

        https://on.cypress.io/component-testing
        `
  },
  UNSUPPORTED_BROWSER_VERSION: (errorMsg: string) => {
    return errTemplate`${guard(errorMsg)}`
  },
  NODE_VERSION_DEPRECATION_SYSTEM: (arg1: {name: string, value: any, configFile: string}) => {
    return errTemplate`\
      Deprecation Warning: ${backtick(arg1.name)} is currently set to ${backtick(arg1.value)} in the ${backtick(arg1.configFile)} configuration file.

      As of ${fmt.cypressVersion(`9.0.0`)} the default behavior of ${backtick(arg1.name)} has changed to always use the version of Node used to start cypress via the cli.

      Please remove the ${backtick(arg1.name)} configuration option from ${backtick(arg1.configFile)}.
      `
  },
  NODE_VERSION_DEPRECATION_BUNDLED: (arg1: {name: string, value: any, configFile: string}) => {
    return errTemplate`\
      Deprecation Warning: ${backtick(arg1.name)} is currently set to ${backtick(arg1.value)} in the ${backtick(arg1.configFile)} configuration file.

      As of ${fmt.cypressVersion(`9.0.0`)} the default behavior of ${backtick(arg1.name)} has changed to always use the version of Node used to start cypress via the cli.

      When ${backtick(arg1.name)} is set to ${backtick(arg1.value)}, Cypress will use the version of Node bundled with electron. This can cause problems running certain plugins or integrations.

      As the ${backtick(arg1.name)} configuration option will be removed in a future release, it is recommended to remove the ${backtick(arg1.name)} configuration option from ${backtick(arg1.configFile)}.
      `
  },
} as const

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: Record<keyof AllCypressErrorObj, (...args: any[]) => ErrTemplateResult> = AllCypressErrors

type AllCypressErrorObj = typeof AllCypressErrors

export function getMsgByType<Type extends keyof AllCypressErrorObj> (type: Type, ...args: Parameters<AllCypressErrorObj[Type]>): string {
  const err = getError(type, ...args)

  return err.message
}

/**
 * Given an error name & params for the error, returns a "CypressError",
 * with a forBrowser property, used when we want to format the value for sending to
 * the browser rather than the terminal.
 *
 * @param type
 * @param args
 * @returns
 */
export const getError = function <Type extends keyof AllCypressErrorObj> (type: Type, ...args: Parameters<AllCypressErrorObj[Type]>) {
  // If we don't know this "type" of error, return as a non-cypress error
  if (!AllCypressErrors[type]) {
    const err = new Error(args[1] || type) as ErrorLike

    err.type = type

    return err
  }

  // @ts-expect-error
  const result = AllCypressErrors[type](...args) as ErrTemplateResult

  const { message, details, originalError, forBrowser } = result

  const err = new Error(message) as CypressError

  err.isCypressErr = true
  err.type = type
  err.details = details
  err.forBrowser = forBrowser
  err.originalError = originalError

  if (originalError) {
    err.stack = originalError.stack
    err.stackWithoutMessage = stackWithoutMessage(originalError.stack ?? '')
  } else {
    const newErr = new Error()

    Error.captureStackTrace(newErr, getError)
    err.stack = newErr.stack
    err.stackWithoutMessage = stackWithoutMessage(err.stack ?? '')
  }

  return err
}

export const logWarning = function <Type extends keyof AllCypressErrorObj> (type: Type, ...args: Parameters<AllCypressErrorObj[Type]>) {
  const err = getError(type, ...args)

  logError(err, 'magenta')

  return null
}

export const throwErr = function <Type extends keyof AllCypressErrorObj> (type: Type, ...args: Parameters<AllCypressErrorObj[Type]>) {
  const err = getError(type, ...args)

  if (!err.originalError) {
    Error.captureStackTrace(err, throwErr)
    err.stackWithoutMessage = stackWithoutMessage(err.stack ?? '')
  }

  throw err
}

// For when the error is passed via the socket-base
interface GenericError extends Error {
  forBrowser?: never
  stackWithoutMessage?: never
  [key: string]: any
}

export const cloneError = function (err: CypressError | GenericError, options: {html?: boolean} = {}) {
  _.defaults(options, {
    html: false,
  })

  const message = _.isFunction(err.forBrowser) ? err.forBrowser().message : err.message

  // pull off these properties
  const obj = _.pick(err, 'type', 'name', 'stack', 'fileName', 'lineNumber', 'columnNumber') as ClonedError

  if (options.html) {
    obj.message = ansi_up.ansi_to_html(message)
    // revert back the distorted characters
    // in case there is an error in a child_process
    // that contains quotes
    .replace(/\&\#x27;/g, '\'')
    .replace(/\&quot\;/g, '"')
  } else {
    obj.message = message
  }

  // and any own (custom) properties
  // of the err object
  for (let prop of Object.keys(err || {})) {
    const val = err[prop]

    obj[prop] = val
  }

  if (err.stackWithoutMessage) {
    obj.stack = err.stackWithoutMessage
  }

  return obj
}

export {
  stripAnsi,
  cloneError as clone,
  throwErr as throw,
  getError as get,
  logWarning as warning,
}

// Re-exporting old namespaces for legacy server access
export {
  logError as log,
  isCypressErr,
} from './errorUtils'
