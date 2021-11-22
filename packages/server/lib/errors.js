/* eslint-disable no-console */
const _ = require('lodash')
const strip = require('strip-ansi')
const chalk = require('chalk')
const AU = require('ansi_up')
const Promise = require('bluebird')
const { stripIndent } = require('./util/strip_indent')

const ansi_up = new AU.default

ansi_up.use_classes = true

const twoOrMoreNewLinesRe = /\n{2,}/

const isProduction = () => {
  return process.env['CYPRESS_INTERNAL_ENV'] === 'production'
}

const listItems = (paths) => {
  return _
  .chain(paths)
  .map((p) => {
    return `- ${chalk.blue(p)}`
  }).join('\n')
  .value()
}

const displayFlags = (obj, mapper) => {
  return _
  .chain(mapper)
  .map((flag, key) => {
    let v

    v = obj[key]

    if (v) {
      return `The ${flag} flag you passed was: ${chalk.blue(v)}`
    }
  }).compact()
  .join('\n')
  .value()
}

const displayRetriesRemaining = function (tries) {
  const times = tries === 1 ? 'time' : 'times'

  const lastTryNewLine = tries === 1 ? '\n' : ''

  return chalk.gray(
    `We will try connecting to it ${tries} more ${times}...${lastTryNewLine}`,
  )
}

const warnIfExplicitCiBuildId = function (ciBuildId) {
  if (!ciBuildId) {
    return ''
  }

  return `\
It also looks like you also passed in an explicit --ci-build-id flag.

This is only necessary if you are NOT running in one of our supported CI providers.

This flag must be unique for each new run, but must also be identical for each machine you are trying to --group or run in --parallel.\
`
}

const trimMultipleNewLines = (str) => {
  return _
  .chain(str)
  .split(twoOrMoreNewLinesRe)
  .compact()
  .join('\n\n')
  .value()
}

const isCypressErr = (err) => {
  return Boolean(err.isCypressErr)
}

const getMsgByType = function (type, arg1 = {}, arg2, arg3) {
  // NOTE: declarations in case blocks are forbidden so we declare them up front
  let filePath; let err; let msg; let str

  switch (type) {
    case 'CANNOT_TRASH_ASSETS':
      return stripIndent`\
        Warning: We failed to trash the existing run results.

        This error will not alter the exit code.

        ${arg1}`
    case 'CANNOT_REMOVE_OLD_BROWSER_PROFILES':
      return stripIndent`\
        Warning: We failed to remove old browser profiles from previous runs.

        This error will not alter the exit code.

        ${arg1}`
    case 'VIDEO_RECORDING_FAILED':
      return stripIndent`\
        Warning: We failed to record the video.

        This error will not alter the exit code.

        ${arg1}`
    case 'VIDEO_POST_PROCESSING_FAILED':
      return stripIndent`\
        Warning: We failed processing this video.

        This error will not alter the exit code.

        ${arg1}`
    case 'CHROME_WEB_SECURITY_NOT_SUPPORTED':
      return stripIndent`\
        Your project has set the configuration option: \`chromeWebSecurity: false\`

        This option will not have an effect in ${_.capitalize(arg1)}. Tests that rely on web security being disabled will not run as expected.`
    case 'BROWSER_NOT_FOUND_BY_NAME':
      str = stripIndent`\
        Can't run because you've entered an invalid browser name.

        Browser: '${arg1}' was not found on your system or is not supported by Cypress.

        Cypress supports the following browsers:
        - chrome
        - chromium
        - edge
        - electron
        - firefox

        You can also use a custom browser: https://on.cypress.io/customize-browsers

        Available browsers found on your system are:
        ${arg2}`

      if (arg1 === 'canary') {
        str += '\n\n'
        str += stripIndent`\
          Note: In Cypress version 4.0.0, Canary must be launched as \`chrome:canary\`, not \`canary\`.

          See https://on.cypress.io/migration-guide for more information on breaking changes in 4.0.0.`
      }

      return str
    case 'BROWSER_NOT_FOUND_BY_PATH':
      msg = stripIndent`\
        We could not identify a known browser at the path you provided: \`${arg1}\`

        The output from the command we ran was:`

      return { msg, details: arg2 }
    case 'NOT_LOGGED_IN':
      return stripIndent`\
        You're not logged in.

        Run \`cypress open\` to open the Desktop App and log in.`
    case 'TESTS_DID_NOT_START_RETRYING':
      return `Timed out waiting for the browser to connect. ${arg1}`
    case 'TESTS_DID_NOT_START_FAILED':
      return 'The browser never connected. Something is wrong. The tests cannot run. Aborting...'
    case 'DASHBOARD_CANCEL_SKIPPED_SPEC':
      return '\n  This spec and its tests were skipped because the run has been canceled.'
    case 'DASHBOARD_API_RESPONSE_FAILED_RETRYING':
      return stripIndent`\
        We encountered an unexpected error talking to our servers.

        We will retry ${arg1.tries} more ${arg1.tries === 1 ? 'time' : 'times'} in ${arg1.delay}...

        The server's response was:

        ${arg1.response}`
    /* Because of displayFlags() and listItems() */
    /* eslint-disable indent */
    case 'DASHBOARD_CANNOT_PROCEED_IN_PARALLEL':
      return stripIndent`\
        We encountered an unexpected error talking to our servers.

        Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

        ${displayFlags(arg1.flags, {
          group: '--group',
          ciBuildId: '--ciBuildId',
        })}

        The server's response was:

        ${arg1.response}`

    case 'DASHBOARD_CANNOT_PROCEED_IN_SERIAL':
      return stripIndent`\
        We encountered an unexpected error talking to our servers.

        ${displayFlags(arg1.flags, {
          group: '--group',
          ciBuildId: '--ciBuildId',
        })}

        The server's response was:

        ${arg1.response}`
    case 'DASHBOARD_UNKNOWN_INVALID_REQUEST':
      return stripIndent`\
        We encountered an unexpected error talking to our servers.

        There is likely something wrong with the request.

        ${displayFlags(arg1.flags, {
            tags: '--tag',
            group: '--group',
            parallel: '--parallel',
            ciBuildId: '--ciBuildId',
          })}

        The server's response was:

        ${arg1.response}`
    case 'DASHBOARD_UNKNOWN_CREATE_RUN_WARNING':
      return stripIndent`\
        Warning from Cypress Dashboard: ${arg1.message}

        Details:
        ${JSON.stringify(arg1.props, null, 2)}`
    case 'DASHBOARD_STALE_RUN':
      return stripIndent`\
        You are attempting to pass the --parallel flag to a run that was completed over 24 hours ago.

        The existing run is: ${arg1.runUrl}

        You cannot parallelize a run that has been complete for that long.

        ${displayFlags(arg1, {
            tags: '--tag',
            group: '--group',
            parallel: '--parallel',
            ciBuildId: '--ciBuildId',
          })}

        https://on.cypress.io/stale-run`
    case 'DASHBOARD_ALREADY_COMPLETE':
      return stripIndent`\
        The run you are attempting to access is already complete and will not accept new groups.

        The existing run is: ${arg1.runUrl}

        When a run finishes all of its groups, it waits for a configurable set of time before finally completing. You must add more groups during that time period.

        ${displayFlags(arg1, {
            tags: '--tag',
            group: '--group',
            parallel: '--parallel',
            ciBuildId: '--ciBuildId',
          })}

        https://on.cypress.io/already-complete`
    case 'DASHBOARD_PARALLEL_REQUIRED':
      return stripIndent`\
        You did not pass the --parallel flag, but this run's group was originally created with the --parallel flag.

        The existing run is: ${arg1.runUrl}

        ${displayFlags(arg1, {
            tags: '--tag',
            group: '--group',
            parallel: '--parallel',
            ciBuildId: '--ciBuildId',
          })}

        You must use the --parallel flag with this group.

        https://on.cypress.io/parallel-required`
    case 'DASHBOARD_PARALLEL_DISALLOWED':
      return stripIndent`\
        You passed the --parallel flag, but this run group was originally created without the --parallel flag.

        The existing run is: ${arg1.runUrl}

        ${displayFlags(arg1, {
            group: '--group',
            parallel: '--parallel',
            ciBuildId: '--ciBuildId',
          })}

        You can not use the --parallel flag with this group.

        https://on.cypress.io/parallel-disallowed`
    case 'DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH':
      return stripIndent`\
        You passed the --parallel flag, but we do not parallelize tests across different environments.

        This machine is sending different environment parameters than the first machine that started this parallel run.

        The existing run is: ${arg1.runUrl}

        In order to run in parallel mode each machine must send identical environment parameters such as:

        ${listItems([
            'specs',
            'osName',
            'osVersion',
            'browserName',
            'browserVersion (major)',
          ])}

        This machine sent the following parameters:

        ${JSON.stringify(arg1.parameters, null, 2)}

        https://on.cypress.io/parallel-group-params-mismatch`
    case 'DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE':
      return stripIndent`\
        You passed the --group flag, but this group name has already been used for this run.

        The existing run is: ${arg1.runUrl}

        ${displayFlags(arg1, {
            group: '--group',
            parallel: '--parallel',
            ciBuildId: '--ciBuildId',
          })}

        If you are trying to parallelize this run, then also pass the --parallel flag, else pass a different group name.

        ${warnIfExplicitCiBuildId(arg1.ciBuildId)}

        https://on.cypress.io/run-group-name-not-unique`
    case 'INDETERMINATE_CI_BUILD_ID':
      return stripIndent`\
        You passed the --group or --parallel flag but we could not automatically determine or generate a ciBuildId.

        ${displayFlags(arg1, {
            group: '--group',
            parallel: '--parallel',
          })}

        In order to use either of these features a ciBuildId must be determined.

        The ciBuildId is automatically detected if you are running Cypress in any of the these CI providers:

        ${listItems(arg2)}

        Because the ciBuildId could not be auto-detected you must pass the --ci-build-id flag manually.

        https://on.cypress.io/indeterminate-ci-build-id`
    case 'RECORD_PARAMS_WITHOUT_RECORDING':
      return stripIndent`\
        You passed the --ci-build-id, --group, --tag, or --parallel flag without also passing the --record flag.

        ${displayFlags(arg1, {
            ciBuildId: '--ci-build-id',
            tags: '--tag',
            group: '--group',
            parallel: '--parallel',
          })}

        These flags can only be used when recording to the Cypress Dashboard service.

        https://on.cypress.io/record-params-without-recording`
    case 'INCORRECT_CI_BUILD_ID_USAGE':
      return stripIndent`\
        You passed the --ci-build-id flag but did not provide either a --group or --parallel flag.

        ${displayFlags(arg1, {
            ciBuildId: '--ci-build-id',
          })}

        The --ci-build-id flag is used to either group or parallelize multiple runs together.

        https://on.cypress.io/incorrect-ci-build-id-usage`
    /* eslint-enable indent */
    case 'RECORD_KEY_MISSING':
      return stripIndent`\
        You passed the --record flag but did not provide us your Record Key.

        You can pass us your Record Key like this:

          ${chalk.blue('cypress run --record --key <record_key>')}

        You can also set the key as an environment variable with the name CYPRESS_RECORD_KEY.

        https://on.cypress.io/how-do-i-record-runs`
    case 'CANNOT_RECORD_NO_PROJECT_ID':
      return stripIndent`\
        You passed the --record flag but this project has not been setup to record.

        This project is missing the 'projectId' inside of '${arg1}'.

        We cannot uniquely identify this project without this id.

        You need to setup this project to record. This will generate a unique 'projectId'.

        Alternatively if you omit the --record flag this project will run without recording.

        https://on.cypress.io/recording-project-runs`
    case 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION':
      return stripIndent`\
        This project has been configured to record runs on our Dashboard.

        It currently has the projectId: ${chalk.green(arg1)}

        You also provided your Record Key, but you did not pass the --record flag.

        This run will not be recorded.

        If you meant to have this run recorded please additionally pass this flag.

          ${chalk.blue('cypress run --record')}

        If you don't want to record these runs, you can silence this warning:

          ${chalk.yellow('cypress run --record false')}

        https://on.cypress.io/recording-project-runs`
    case 'DASHBOARD_INVALID_RUN_REQUEST':
      return stripIndent`\
        Recording this run failed because the request was invalid.

        ${arg1.message}

        Errors:

        ${JSON.stringify(arg1.errors, null, 2)}

        Request Sent:

        ${JSON.stringify(arg1.object, null, 2)}`
    case 'RECORDING_FROM_FORK_PR':
      return stripIndent`\
        Warning: It looks like you are trying to record this run from a forked PR.

        The 'Record Key' is missing. Your CI provider is likely not passing private environment variables to builds from forks.

        These results will not be recorded.

        This error will not alter the exit code.`
    case 'DASHBOARD_CANNOT_UPLOAD_RESULTS':
      return stripIndent`\
        Warning: We encountered an error while uploading results from your run.

        These results will not be recorded.

        This error will not alter the exit code.

        ${arg1}`
    case 'DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE':
      return stripIndent`\
        Warning: We encountered an error talking to our servers.

        This run will not be recorded.

        This error will not alter the exit code.

        ${arg1}`
    case 'DASHBOARD_RECORD_KEY_NOT_VALID':
      return stripIndent`\
        Your Record Key ${chalk.yellow(arg1)} is not valid with this project: ${chalk.blue(arg2)}

        It may have been recently revoked by you or another user.

        Please log into the Dashboard to see the valid record keys.

        https://on.cypress.io/dashboard/projects/${arg2}`
    case 'DASHBOARD_PROJECT_NOT_FOUND':
      return stripIndent`\
        We could not find a project with the ID: ${chalk.yellow(arg1)}

        This projectId came from your '${arg2}' file or an environment variable.

        Please log into the Dashboard and find your project.

        We will list the correct projectId in the 'Settings' tab.

        Alternatively, you can create a new project using the Desktop Application.

        https://on.cypress.io/dashboard`
    case 'NO_PROJECT_ID':
      return `Can't find 'projectId' in the '${arg1}' file for this project: ${chalk.blue(arg2)}`
    case 'NO_PROJECT_FOUND_AT_PROJECT_ROOT':
      return `Can't find project at the path: ${chalk.blue(arg1)}`
    case 'CANNOT_FETCH_PROJECT_TOKEN':
      return 'Can\'t find project\'s secret key.'
    case 'CANNOT_CREATE_PROJECT_TOKEN':
      return 'Can\'t create project\'s secret key.'
    case 'PORT_IN_USE_SHORT':
      return `Port ${arg1} is already in use.`
    case 'PORT_IN_USE_LONG':
      return stripIndent`\
        Can't run project because port is currently in use: ${chalk.blue(arg1)}

        ${chalk.yellow('Assign a different port with the \'--port <port>\' argument or shut down the other running process.')}`
    case 'ERROR_READING_FILE':
      filePath = `\`${arg1}\``
      err = `\`${arg2.type || arg2.code || arg2.name}: ${arg2.message}\``

      return stripIndent`\
        Error reading from: ${chalk.blue(filePath)}

        ${chalk.yellow(err)}`
    case 'ERROR_WRITING_FILE':
      filePath = `\`${arg1}\``
      err = `\`${arg2}\``

      return stripIndent`\
        Error writing to: ${chalk.blue(filePath)}

        ${chalk.yellow(err)}`

    case 'NO_SPECS_FOUND':
      // no glob provided, searched all specs
      if (!arg2) {
        return stripIndent`\
          Can't run because no spec files were found.

          We searched for any files inside of this folder:

          ${chalk.blue(arg1)}`
      }

      return stripIndent`\
        Can't run because no spec files were found.

        We searched for any files matching this glob pattern:

        ${chalk.blue(arg2)}

        Relative to the project root folder:

        ${chalk.blue(arg1)}`

    case 'RENDERER_CRASHED':
      return stripIndent`\
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
    case 'AUTOMATION_SERVER_DISCONNECTED':
      return 'The automation client disconnected. Cannot continue running tests.'
    case 'SUPPORT_FILE_NOT_FOUND':
      return stripIndent`\
        The support file is missing or invalid.

        Your \`supportFile\` is set to \`${arg1}\`, but either the file is missing or it's invalid. The \`supportFile\` must be a \`.js\`, \`.ts\`, \`.coffee\` file or be supported by your preprocessor plugin (if configured).

        Correct your \`${arg2}\`, create the appropriate file, or set \`supportFile\` to \`false\` if a support file is not necessary for your project.

        Or you might have renamed the extension of your \`supportFile\` to \`.ts\`. If that's the case, restart the test runner.

        Learn more at https://on.cypress.io/support-file-missing-or-invalid`
    case 'PLUGINS_FILE_ERROR':
      msg = stripIndent`\
        The plugins file is missing or invalid.

        Your \`pluginsFile\` is set to \`${arg1}\`, but either the file is missing, it contains a syntax error, or threw an error when required. The \`pluginsFile\` must be a \`.js\`, \`.ts\`, or \`.coffee\` file.

        Or you might have renamed the extension of your \`pluginsFile\`. If that's the case, restart the test runner.

        Please fix this, or set \`pluginsFile\` to \`false\` if a plugins file is not necessary for your project.`.trim()

      if (arg2) {
        return { msg, details: arg2 }
      }

      return msg
    case 'PLUGINS_DIDNT_EXPORT_FUNCTION':
      msg = stripIndent`\
        The \`pluginsFile\` must export a function with the following signature:

        \`\`\`
        module.exports = function (on, config) {
          // configure plugins here
        }
        \`\`\`

        Learn more: https://on.cypress.io/plugins-api

        We loaded the \`pluginsFile\` from: \`${arg1}\`

        It exported:`

      return { msg, details: JSON.stringify(arg2) }
    case 'PLUGINS_FUNCTION_ERROR':
      msg = stripIndent`\
        The function exported by the plugins file threw an error.

        We invoked the function exported by \`${arg1}\`, but it threw an error.`

      return { msg, details: arg2 }
    case 'PLUGINS_UNEXPECTED_ERROR':
      msg = `The following error was thrown by a plugin. We stopped running your tests because a plugin crashed. Please check your plugins file (\`${arg1}\`)`

      return { msg, details: arg2 }
    case 'PLUGINS_VALIDATION_ERROR':
      msg = `The following validation error was thrown by your plugins file (\`${arg1}\`).`

      return { msg, details: arg2 }
    case 'BUNDLE_ERROR':
      // IF YOU MODIFY THIS MAKE SURE TO UPDATE
      // THE ERROR MESSAGE IN THE RUNNER TOO
      return stripIndent`\
        Oops...we found an error preparing this test file:

          ${chalk.blue(arg1)}

        The error was:

        ${chalk.yellow(arg2)}

        This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

        - A missing file or dependency
        - A syntax error in the file or one of its dependencies

        Fix the error in your code and re-run your tests.`

    // happens when there is an error in configuration file like "cypress.json"
    case 'SETTINGS_VALIDATION_ERROR':
      filePath = `\`${arg1}\``

      return stripIndent`\
        We found an invalid value in the file: ${chalk.blue(filePath)}

        ${chalk.yellow(arg2)}`
    // happens when there is an invalid config value is returned from the
    // project's plugins file like "cypress/plugins.index.js"
    case 'PLUGINS_CONFIG_VALIDATION_ERROR':
      filePath = `\`${arg1}\``

      return stripIndent`\
        An invalid configuration value returned from the plugins file: ${chalk.blue(filePath)}

        ${chalk.yellow(arg2)}`
    // general configuration error not-specific to configuration or plugins files
    case 'CONFIG_VALIDATION_ERROR':
      return stripIndent`\
        We found an invalid configuration value:

        ${chalk.yellow(arg1)}`
    case 'RENAMED_CONFIG_OPTION':
      return stripIndent`\
        The ${chalk.yellow(arg1.name)} configuration option you have supplied has been renamed.

        Please rename ${chalk.yellow(arg1.name)} to ${chalk.blue(arg1.newName)}`
    case 'CANNOT_CONNECT_BASE_URL':
      return stripIndent`\
        Cypress failed to verify that your server is running.

        Please start this server and then run Cypress again.`
    case 'CANNOT_CONNECT_BASE_URL_WARNING':
      return stripIndent`\
        Cypress could not verify that this server is running:

          > ${chalk.blue(arg1)}

        This server has been configured as your \`baseUrl\`, and tests will likely fail if it is not running.`
    case 'CANNOT_CONNECT_BASE_URL_RETRYING':
      switch (arg1.attempt) {
        case 1:
          return stripIndent`\
            Cypress could not verify that this server is running:

              > ${chalk.blue(arg1.baseUrl)}

            We are verifying this server because it has been configured as your \`baseUrl\`.

            Cypress automatically waits until your server is accessible before running tests.

            ${displayRetriesRemaining(arg1.remaining)}`
        default:
          return `${displayRetriesRemaining(arg1.remaining)}`
      }
    case 'INVALID_REPORTER_NAME':
      return stripIndent`\
        Could not load reporter by name: ${chalk.yellow(arg1.name)}

        We searched for the reporter in these paths:

        ${listItems(arg1.paths)}

        The error we received was:

        ${chalk.yellow(arg1.error)}

        Learn more at https://on.cypress.io/reporters`
      // TODO: update with vetted cypress language
    case 'NO_DEFAULT_CONFIG_FILE_FOUND':
      return stripIndent`\
        Could not find a Cypress configuration file, exiting.

        We looked but did not find a default config file in this folder: ${chalk.blue(arg1)}`
      // TODO: update with vetted cypress language
    case 'CONFIG_FILES_LANGUAGE_CONFLICT':
      return stripIndent`
          There is both a \`${arg2}\` and a \`${arg3}\` at the location below:
          ${arg1}

          Cypress does not know which one to read for config. Please remove one of the two and try again.
          `
    case 'CONFIG_FILE_NOT_FOUND':
      return stripIndent`\
        Could not find a Cypress configuration file, exiting.

        We looked but did not find a ${chalk.blue(arg1)} file in this folder: ${chalk.blue(arg2)}`
    case 'INVOKED_BINARY_OUTSIDE_NPM_MODULE':
      return stripIndent`\
        It looks like you are running the Cypress binary directly.

        This is not the recommended approach, and Cypress may not work correctly.

        Please install the 'cypress' NPM package and follow the instructions here:

        https://on.cypress.io/installing-cypress`
    case 'DUPLICATE_TASK_KEY':
      return `Warning: Multiple attempts to register the following task(s): ${chalk.blue(arg1)}. Only the last attempt will be registered.`
    case 'FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS':
      return stripIndent`\
        You've exceeded the limit of private test results under your free plan this month. ${arg1.usedTestsMessage}

        To continue recording tests this month you must upgrade your account. Please visit your billing to upgrade to another billing plan.

        ${arg1.link}`
    case 'FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS':
      return stripIndent`\
        You've exceeded the limit of private test results under your free plan this month. ${arg1.usedTestsMessage}

        Your plan is now in a grace period, which means your tests will still be recorded until ${arg1.gracePeriodMessage}. Please upgrade your plan to continue recording tests on the Cypress Dashboard in the future.

        ${arg1.link}`
    case 'PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS':
      return stripIndent`\
        You've exceeded the limit of private test results under your current billing plan this month. ${arg1.usedTestsMessage}

        To upgrade your account, please visit your billing to upgrade to another billing plan.

        ${arg1.link}`
    case 'FREE_PLAN_EXCEEDS_MONTHLY_TESTS':
      return stripIndent`\
        You've exceeded the limit of test results under your free plan this month. ${arg1.usedTestsMessage}

        To continue recording tests this month you must upgrade your account. Please visit your billing to upgrade to another billing plan.

        ${arg1.link}`
    case 'FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS':
      return stripIndent`\
        You've exceeded the limit of test results under your free plan this month. ${arg1.usedTestsMessage}

        Your plan is now in a grace period, which means you will have the full benefits of your current plan until ${arg1.gracePeriodMessage}.

        Please visit your billing to upgrade your plan.

        ${arg1.link}`
    case 'PLAN_EXCEEDS_MONTHLY_TESTS':
      return stripIndent`\
        You've exceeded the limit of test results under your ${arg1.planType} billing plan this month. ${arg1.usedTestsMessage}

        To continue getting the full benefits of your current plan, please visit your billing to upgrade.

        ${arg1.link}`
    case 'FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE':
      return stripIndent`\
        Parallelization is not included under your free plan.

        Your plan is now in a grace period, which means your tests will still run in parallel until ${arg1.gracePeriodMessage}. Please upgrade your plan to continue running your tests in parallel in the future.

        ${arg1.link}`
    case 'PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN':
      return stripIndent`\
        Parallelization is not included under your current billing plan.

        To run your tests in parallel, please visit your billing and upgrade to another plan with parallelization.

        ${arg1.link}`
    case 'PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED':
      return stripIndent`\
        Grouping is not included under your free plan.

        Your plan is now in a grace period, which means your tests will still run with groups until ${arg1.gracePeriodMessage}. Please upgrade your plan to continue running your tests with groups in the future.

        ${arg1.link}`
    case 'RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN':
      return stripIndent`\
        Grouping is not included under your current billing plan.

        To run your tests with groups, please visit your billing and upgrade to another plan with grouping.

        ${arg1.link}`
    case 'FIXTURE_NOT_FOUND':
      return stripIndent`\
        A fixture file could not be found at any of the following paths:

        > ${arg1}
        > ${arg1}{{extension}}

        Cypress looked for these file extensions at the provided path:

        > ${arg2.join(', ')}

        Provide a path to an existing fixture file.`
    case 'AUTH_COULD_NOT_LAUNCH_BROWSER':
      return stripIndent`\
        Cypress was unable to open your installed browser. To continue logging in, please open this URL in your web browser:

        \`\`\`
        ${arg1}
        \`\`\``
    case 'AUTH_BROWSER_LAUNCHED':
      return `Check your browser to continue logging in.`
    case 'BAD_POLICY_WARNING':
      return stripIndent`\
        Cypress detected policy settings on your computer that may cause issues.

        The following policies were detected that may prevent Cypress from automating Chrome:

        ${arg1.map((line) => ` > ${line}`).join('\n')}

        For more information, see https://on.cypress.io/bad-browser-policy`
    case 'BAD_POLICY_WARNING_TOOLTIP':
      return `Cypress detected policy settings on your computer that may cause issues with using this browser. For more information, see https://on.cypress.io/bad-browser-policy`
    case 'EXTENSION_NOT_LOADED':
      return stripIndent`\
        ${arg1} could not install the extension at path:

        > ${arg2}

        Please verify that this is the path to a valid, unpacked WebExtension.`
    case 'COULD_NOT_FIND_SYSTEM_NODE':
      return stripIndent`\
        \`nodeVersion\` is set to \`system\`, but Cypress could not find a usable Node executable on your PATH.

        Make sure that your Node executable exists and can be run by the current user.

        Cypress will use the built-in Node version (v${arg1}) instead.`
    case 'INVALID_CYPRESS_INTERNAL_ENV':
      return stripIndent`\
        We have detected an unknown or unsupported "CYPRESS_INTERNAL_ENV" value

          ${chalk.yellow(arg1)}

        "CYPRESS_INTERNAL_ENV" is reserved and should only be used internally.

        Do not modify the "CYPRESS_INTERNAL_ENV" value.`
    case 'CDP_VERSION_TOO_OLD':
      return `A minimum CDP version of v${arg1} is required, but the current browser has ${arg2.major !== 0 ? `v${arg2.major}.${arg2.minor}` : 'an older version'}.`
    case 'CDP_COULD_NOT_CONNECT':
      return stripIndent`\
        Cypress failed to make a connection to the Chrome DevTools Protocol after retrying for 50 seconds.

        This usually indicates there was a problem opening the ${arg3} browser.

        The CDP port requested was ${chalk.yellow(arg1)}.

        Error details:

        ${arg2.stack}`
    case 'FIREFOX_COULD_NOT_CONNECT':
      return stripIndent`\
        Cypress failed to make a connection to Firefox.

        This usually indicates there was a problem opening the Firefox browser.

        Error details:

        ${arg1.stack}`
    case 'CDP_COULD_NOT_RECONNECT':
      return stripIndent`\
        There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.

        ${arg1.stack}`
    case 'CDP_RETRYING_CONNECTION':
      return `Still waiting to connect to ${arg2}, retrying in 1 second (attempt ${chalk.yellow(arg1)}/62)`
    case 'DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS':
      return stripIndent`\
        Deprecation Warning: The \`before:browser:launch\` plugin event changed its signature in version \`4.0.0\`

        The \`before:browser:launch\` plugin event switched from yielding the second argument as an \`array\` of browser arguments to an options \`object\` with an \`args\` property.

        We've detected that your code is still using the previous, deprecated interface signature.

        This code will not work in a future version of Cypress. Please see the upgrade guide: ${chalk.yellow('https://on.cypress.io/deprecated-before-browser-launch-args')}`
    case 'UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES':
      return stripIndent`\
        The \`launchOptions\` object returned by your plugin's \`before:browser:launch\` handler contained unexpected properties:

        ${listItems(arg1)}

        \`launchOptions\` may only contain the properties:

        ${listItems(arg2)}

        https://on.cypress.io/browser-launch-api`
    case 'COULD_NOT_PARSE_ARGUMENTS':
      return stripIndent`\
        Cypress encountered an error while parsing the argument ${chalk.gray(arg1)}

        You passed: ${arg2}

        The error was: ${arg3}`
    case 'FIREFOX_MARIONETTE_FAILURE':
      return stripIndent`\
        Cypress could not connect to Firefox.

        An unexpected error was received from Marionette ${arg1}:

        ${arg2}

        To avoid this error, ensure that there are no other instances of Firefox launched by Cypress running.`
    case 'FOLDER_NOT_WRITABLE':
      return stripIndent`\
        Folder ${arg1} is not writable.

        Writing to this directory is required by Cypress in order to store screenshots and videos.

        Enable write permissions to this directory to ensure screenshots and videos are stored.

        If you don't require screenshots or videos to be stored you can safely ignore this warning.`
    case 'EXPERIMENTAL_SAMESITE_REMOVED':
      return stripIndent`\
        The \`experimentalGetCookiesSameSite\` configuration option was removed in Cypress version \`5.0.0\`. Yielding the \`sameSite\` property is now the default behavior of the \`cy.cookie\` commands.

        You can safely remove this option from your config.`
    case 'EXPERIMENTAL_COMPONENT_TESTING_REMOVED':
      return stripIndent`\
        The ${chalk.yellow(`\`experimentalComponentTesting\``)} configuration option was removed in Cypress version \`7.0.0\`. Please remove this flag from ${chalk.yellow(`\`${arg1.configFile}\``)}.

        Cypress Component Testing is now a standalone command. You can now run your component tests with:

        ${chalk.yellow(`\`cypress open-ct\``)}

        https://on.cypress.io/migration-guide`
    case 'EXPERIMENTAL_SHADOW_DOM_REMOVED':
      return stripIndent`\
        The \`experimentalShadowDomSupport\` configuration option was removed in Cypress version \`5.2.0\`. It is no longer necessary when utilizing the \`includeShadowDom\` option.

        You can safely remove this option from your config.`
    case 'EXPERIMENTAL_NETWORK_STUBBING_REMOVED':
      return stripIndent`\
        The \`experimentalNetworkStubbing\` configuration option was removed in Cypress version \`6.0.0\`.
        It is no longer necessary for using \`cy.intercept()\` (formerly \`cy.route2()\`).

        You can safely remove this option from your config.`
    case 'EXPERIMENTAL_RUN_EVENTS_REMOVED':
      return stripIndent`\
        The \`experimentalRunEvents\` configuration option was removed in Cypress version \`6.7.0\`. It is no longer necessary when listening to run events in the plugins file.

        You can safely remove this option from your config.`
    case 'FIREFOX_GC_INTERVAL_REMOVED':
      return stripIndent`\
        The \`firefoxGcInterval\` configuration option was removed in Cypress version \`8.0.0\`. It was introduced to work around a bug in Firefox 79 and below.

        Since Cypress no longer supports Firefox 85 and below in Cypress 8, this option was removed.

        You can safely remove this option from your config.`
    case 'INCOMPATIBLE_PLUGIN_RETRIES':
      return stripIndent`\
      We've detected that the incompatible plugin \`cypress-plugin-retries\` is installed at \`${arg1}\`.

      Test retries is now supported in Cypress version \`5.0.0\`.

      Remove the plugin from your dependencies to silence this warning.

      https://on.cypress.io/test-retries
      `
    case 'INVALID_CONFIG_OPTION':
      return stripIndent`\
        ${arg1.map((arg) => `\`${arg}\` is not a valid configuration option`)}

        https://on.cypress.io/configuration
        `
    case 'PLUGINS_RUN_EVENT_ERROR':
      return stripIndent`\
        An error was thrown in your plugins file while executing the handler for the '${chalk.blue(arg1)}' event.

        The error we received was:

        ${chalk.yellow(arg2)}
      `
    case 'CT_NO_DEV_START_EVENT':
      return stripIndent`\
        To run component-testing, cypress needs the \`dev-server:start\` event.

        Implement it by adding a \`on('dev-server:start', () => startDevServer())\` call in your pluginsFile.
        ${arg1 ?
        stripIndent`\
        You can find the \'pluginsFile\' at the following path:

        ${arg1}
        ` : ''}
        Learn how to set up component testing:

        https://on.cypress.io/component-testing
        `
    case 'UNSUPPORTED_BROWSER_VERSION':
      return arg1
    case 'WIN32_UNSUPPORTED':
      return stripIndent`\
        You are attempting to run Cypress on Windows 32-bit. Cypress has removed Windows 32-bit support.

        ${arg1 ? 'Try installing Node.js 64-bit and reinstalling Cypress to use the 64-bit build.'
        : 'Consider upgrading to a 64-bit OS to continue using Cypress.'}
        `
    case 'NODE_VERSION_DEPRECATION_SYSTEM':
      return stripIndent`\
      Deprecation Warning: ${chalk.yellow(`\`${arg1.name}\``)} is currently set to ${chalk.yellow(`\`${arg1.value}\``)} in the ${chalk.yellow(`\`${arg1.configFile}\``)} configuration file. As of Cypress version \`9.0.0\` the default behavior of ${chalk.yellow(`\`${arg1.name}\``)} has changed to always use the version of Node used to start cypress via the cli.
      Please remove the ${chalk.yellow(`\`${arg1.name}\``)} configuration option from ${chalk.yellow(`\`${arg1.configFile}\``)}.
      `
    case 'NODE_VERSION_DEPRECATION_BUNDLED':
      return stripIndent`\
      Deprecation Warning: ${chalk.yellow(`\`${arg1.name}\``)} is currently set to ${chalk.yellow(`\`${arg1.value}\``)} in the ${chalk.yellow(`\`${arg1.configFile}\``)} configuration file. As of Cypress version \`9.0.0\` the default behavior of ${chalk.yellow(`\`${arg1.name}\``)} has changed to always use the version of Node used to start cypress via the cli. When ${chalk.yellow(`\`${arg1.name}\``)} is set to ${chalk.yellow(`\`${arg1.value}\``)}, Cypress will use the version of Node bundled with electron. This can cause problems running certain plugins or integrations. 
      As the ${chalk.yellow(`\`${arg1.name}\``)} configuration option will be removed in a future release, it is recommended to remove the ${chalk.yellow(`\`${arg1.name}\``)} configuration option from ${chalk.yellow(`\`${arg1.configFile}\``)}.
      `
    default:
  }
}

const get = function (type, arg1, arg2, arg3) {
  let details
  let msg = getMsgByType(type, arg1, arg2, arg3)

  if (_.isObject(msg)) {
    ({
      details,
    } = msg);

    ({
      msg,
    } = msg)
  }

  msg = trimMultipleNewLines(msg)

  const err = new Error(msg)

  err.isCypressErr = true
  err.type = type
  err.details = details

  return err
}

const warning = function (type, arg1, arg2) {
  const err = get(type, arg1, arg2)

  log(err, 'magenta')

  return null
}

const throwErr = function (type, arg1, arg2, arg3) {
  throw get(type, arg1, arg2, arg3)
}

const clone = function (err, options = {}) {
  _.defaults(options, {
    html: false,
  })

  // pull off these properties
  const obj = _.pick(err, 'type', 'name', 'stack', 'fileName', 'lineNumber', 'columnNumber')

  if (options.html) {
    obj.message = ansi_up.ansi_to_html(err.message)
    // revert back the distorted characters
    // in case there is an error in a child_process
    // that contains quotes
    .replace(/\&\#x27;/g, '\'')
    .replace(/\&quot\;/g, '"')
  } else {
    obj.message = err.message
  }

  // and any own (custom) properties
  // of the err object
  for (let prop of Object.keys(err || {})) {
    const val = err[prop]

    obj[prop] = val
  }

  return obj
}

const log = function (err, color = 'red') {
  console.log(chalk[color](err.message))

  if (err.details) {
    console.log('\n', chalk['yellow'](err.details))
  }

  // bail if this error came from known
  // list of Cypress errors
  if (isCypressErr(err)) {
    return
  }

  console.log(chalk[color](err.stack))

  return err
}

const logException = Promise.method(function (err) {
  // TODO: remove context here
  if (this.log(err) && isProduction()) {
    // log this exception since
    // its not a known error
    return require('./logger')
    .createException(err)
    .catch(() => {})
  }
})

module.exports = {
  get,

  log,

  logException,

  clone,

  warning,

  // forms well-formatted user-friendly error for most common
  // errors Cypress can encounter
  getMsgByType,

  isCypressErr,

  throw: throwErr,

  stripAnsi: strip,

  displayFlags,
}
