_       = require("lodash")
strip   = require("strip-ansi")
chalk   = require("chalk")
ansi_up = require("ansi_up")
Promise = require("bluebird")

twoOrMoreNewLinesRe = /\n{2,}/

isProduction = ->
  process.env["CYPRESS_ENV"] is "production"

listItems = (paths) ->
  _
  .chain(paths)
  .map (p) ->
    "- " + chalk.blue(p)
  .join("\n")
  .value()

displayFlags = (obj, mapper) ->
  _
  .chain(mapper)
  .map (flag, key) ->
    if v = obj[key]
      "The #{flag} flag you passed was: #{chalk.blue(v)}"
  .compact()
  .join("\n")
  .value()

displayRetriesRemaining = (tries) ->
  times = if tries is 1 then 'time' else 'times'

  lastTryNewLine = if tries is 1 then "\n" else ""

  chalk.gray(
    "We will try connecting to it #{tries} more #{times}...#{lastTryNewLine}"
  )

warnIfExplicitCiBuildId = (ciBuildId) ->
  if not ciBuildId
    return ""

  """
  It also looks like you also passed in an explicit --ci-build-id flag.

  This is only necessary if you are NOT running in one of our supported CI providers.

  This flag must be unique for each new run, but must also be identical for each machine you are trying to --group or run in --parallel.
  """

trimMultipleNewLines = (str) ->
  _
  .chain(str)
  .split(twoOrMoreNewLinesRe)
  .compact()
  .join("\n\n")
  .value()

isCypressErr = (err) ->
  Boolean(err.isCypressErr)

getMsgByType = (type, arg1 = {}, arg2) ->
  switch type
    when "CANNOT_TRASH_ASSETS"
      """
      Warning: We failed to trash the existing run results.

      This error will not alter the exit code.

      #{arg1}
      """
    when "CANNOT_REMOVE_OLD_BROWSER_PROFILES"
      """
      Warning: We failed to remove old browser profiles from previous runs.

      This error will not alter the exit code.

      #{arg1}
      """
    when "VIDEO_RECORDING_FAILED"
      """
      Warning: We failed to record the video.

      This error will not alter the exit code.

      #{arg1}
      """
    when "VIDEO_POST_PROCESSING_FAILED"
      """
      Warning: We failed processing this video.

      This error will not alter the exit code.

      #{arg1}
      """
    when "BROWSER_NOT_FOUND_BY_NAME"
      """
      Can't run because you've entered an invalid browser name.

      Browser: '#{arg1}' was not found on your system.

      Available browsers found are: #{arg2}
      """
    when "BROWSER_NOT_FOUND_BY_PATH"
      msg = """
      We could not identify a known browser at the path you provided: `#{arg1}`

      The output from the command we ran was:
      """
      return {msg: msg, details: arg2}
    when "CANNOT_RECORD_VIDEO_HEADED"
      """
      Warning: Cypress can only record videos when running headlessly.

      You have set the 'electron' browser to run headed.

      A video will not be recorded when using this mode.
      """
    when "CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER"
      """
      Warning: Cypress can only record videos when using the built in 'electron' browser.

      You have set the browser to: '#{arg1}'

      A video will not be recorded when using this browser.
      """
    when "NOT_LOGGED_IN"
      """
      You're not logged in.

      Run `cypress open` to open the Desktop App and log in.
      """
    when "TESTS_DID_NOT_START_RETRYING"
      "Timed out waiting for the browser to connect. #{arg1}"
    when "TESTS_DID_NOT_START_FAILED"
      "The browser never connected. Something is wrong. The tests cannot run. Aborting..."
    when "DASHBOARD_API_RESPONSE_FAILED_RETRYING"
      """
      We encountered an unexpected error talking to our servers.

      We will retry #{arg1.tries} more #{if arg1.tries is 1 then 'time' else 'times'} in #{arg1.delay}...

      The server's response was:

      #{arg1.response}
      """
    when "DASHBOARD_CANNOT_PROCEED_IN_PARALLEL"
      """
      We encountered an unexpected error talking to our servers.

      Because you passed the --parallel flag, this run cannot proceed because it requires a valid response from our servers.

      #{displayFlags(arg1.flags, {
        group: "--group",
        ciBuildId: "--ciBuildId",
      })}

      The server's response was:

      #{arg1.response}
      """
    when "DASHBOARD_UNKNOWN_INVALID_REQUEST"
      """
      We encountered an unexpected error talking to our servers.

      There is likely something wrong with the request.

      #{displayFlags(arg1.flags, {
        group: "--group",
        parallel: "--parallel",
        ciBuildId: "--ciBuildId",
      })}

      The server's response was:

      #{arg1.response}
      """
    when "DASHBOARD_UNKNOWN_CREATE_RUN_WARNING"
      """
      Warning from Cypress Dashboard: #{arg1.message}

      Details:
      #{JSON.stringify(arg1.props, null, 2)}
      """
    when "DASHBOARD_STALE_RUN"
      """
      You are attempting to pass the --parallel flag to a run that was completed over 24 hours ago.

      The existing run is: #{arg1.runUrl}

      You cannot parallelize a run that has been complete for that long.

      #{displayFlags(arg1, {
        group: "--group",
        parallel: "--parallel",
        ciBuildId: "--ciBuildId",
      })}

      https://on.cypress.io/stale-run
      """
    when "DASHBOARD_ALREADY_COMPLETE"
      """
      The run you are attempting to access is already complete and will not accept new groups.

      The existing run is: #{arg1.runUrl}

      When a run finishes all of its groups, it waits for a configurable set of time before finally completing. You must add more groups during that time period.

      #{displayFlags(arg1, {
        group: "--group",
        parallel: "--parallel",
        ciBuildId: "--ciBuildId",
      })}

      https://on.cypress.io/already-complete
      """
    when "DASHBOARD_PARALLEL_REQUIRED"
      """
      You did not pass the --parallel flag, but this run's group was originally created with the --parallel flag.

      The existing run is: #{arg1.runUrl}

      #{displayFlags(arg1, {
        group: "--group",
        parallel: "--parallel",
        ciBuildId: "--ciBuildId",
      })}

      You must use the --parallel flag with this group.

      https://on.cypress.io/parallel-required
      """
    when "DASHBOARD_PARALLEL_DISALLOWED"
      """
      You passed the --parallel flag, but this run group was originally created without the --parallel flag.

      The existing run is: #{arg1.runUrl}

      #{displayFlags(arg1, {
        group: "--group",
        parallel: "--parallel",
        ciBuildId: "--ciBuildId",
      })}

      You can not use the --parallel flag with this group.

      https://on.cypress.io/parallel-disallowed
      """
    when "DASHBOARD_PARALLEL_GROUP_PARAMS_MISMATCH"
      """
      You passed the --parallel flag, but we do not parallelize tests across different environments.

      This machine is sending different environment parameters than the first machine that started this parallel run.

      The existing run is: #{arg1.runUrl}

      In order to run in parallel mode each machine must send identical environment parameters such as:

      #{listItems([
        "specs",
        "osName",
        "osVersion",
        "browserName",
        "browserVersion (major)",
      ])}

      This machine sent the following parameters:

      #{JSON.stringify(arg1.parameters, null, 2)}

      https://on.cypress.io/parallel-group-params-mismatch
      """
    when "DASHBOARD_RUN_GROUP_NAME_NOT_UNIQUE"
      """
      You passed the --group flag, but this group name has already been used for this run.

      The existing run is: #{arg1.runUrl}

      #{displayFlags(arg1, {
        group: "--group",
        parallel: "--parallel",
        ciBuildId: "--ciBuildId",
      })}

      If you are trying to parallelize this run, then also pass the --parallel flag, else pass a different group name.

      #{warnIfExplicitCiBuildId(arg1.ciBuildId)}

      https://on.cypress.io/run-group-name-not-unique
      """
    when "INDETERMINATE_CI_BUILD_ID"
      """
      You passed the --group or --parallel flag but we could not automatically determine or generate a ciBuildId.

      #{displayFlags(arg1, {
        group: "--group",
        parallel: "--parallel"
      })}

      In order to use either of these features a ciBuildId must be determined.

      The ciBuildId is automatically detected if you are running Cypress in any of the these CI providers:

      #{listItems(arg2)}

      Because the ciBuildId could not be auto-detected you must pass the --ci-build-id flag manually.

      https://on.cypress.io/indeterminate-ci-build-id
      """
    when "RECORD_PARAMS_WITHOUT_RECORDING"
      """
      You passed the --ci-build-id, --group, or --parallel flag without also passing the --record flag.

      #{displayFlags(arg1, {
        ciBuildId: "--ci-build-id",
        group: "--group",
        parallel: "--parallel"
      })}

      These flags can only be used when recording to the Cypress Dashboard service.

      https://on.cypress.io/record-params-without-recording
      """
    when "INCORRECT_CI_BUILD_ID_USAGE"
      """
      You passed the --ci-build-id flag but did not provide either a --group or --parallel flag.

      #{displayFlags(arg1, {
        ciBuildId: "--ci-build-id",
      })}

      The --ci-build-id flag is used to either group or parallelize multiple runs together.

      https://on.cypress.io/incorrect-ci-build-id-usage
      """
    when "RECORD_KEY_MISSING"
      """
      You passed the --record flag but did not provide us your Record Key.

      You can pass us your Record Key like this:

        #{chalk.blue("cypress run --record --key <record_key>")}

      You can also set the key as an environment variable with the name CYPRESS_RECORD_KEY.

      https://on.cypress.io/how-do-i-record-runs
      """
    when "CANNOT_RECORD_NO_PROJECT_ID"
      """
      You passed the --record flag but this project has not been setup to record.

      This project is missing the 'projectId' inside of 'cypress.json'.

      We cannot uniquely identify this project without this id.

      You need to setup this project to record. This will generate a unique 'projectId'.

      Alternatively if you omit the --record flag this project will run without recording.

      https://on.cypress.io/recording-project-runs
      """
    when "PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION"
      """
      This project has been configured to record runs on our Dashboard.

      It currently has the projectId: #{chalk.green(arg1)}

      You also provided your Record Key, but you did not pass the --record flag.

      This run will not be recorded.

      If you meant to have this run recorded please additionally pass this flag.

        #{chalk.blue("cypress run --record")}

      If you don't want to record these runs, you can silence this warning:

        #{chalk.yellow("cypress run --record false")}

      https://on.cypress.io/recording-project-runs
      """
    when "CYPRESS_CI_DEPRECATED"
      """
      You are using the deprecated command: #{chalk.yellow("cypress ci <key>")}

      Please switch and use: #{chalk.blue("cypress run --record --key <record_key>")}

      https://on.cypress.io/cypress-ci-deprecated
      """
    when "CYPRESS_CI_DEPRECATED_ENV_VAR"
      """
      1. You are using the deprecated command: #{chalk.yellow("cypress ci")}

          Please switch and use: #{chalk.blue("cypress run --record")}

      2. You are also using the environment variable: #{chalk.yellow("CYPRESS_CI_KEY")}

          Please rename this environment variable to: #{chalk.blue("CYPRESS_RECORD_KEY")}

      https://on.cypress.io/cypress-ci-deprecated
      """
    when "DASHBOARD_INVALID_RUN_REQUEST"
      """
      Recording this run failed because the request was invalid.

      #{arg1.message}

      Errors:

      #{JSON.stringify(arg1.errors, null, 2)}

      Request Sent:

      #{JSON.stringify(arg1.object, null, 2)}
      """
    when "RECORDING_FROM_FORK_PR"
      """
      Warning: It looks like you are trying to record this run from a forked PR.

      The 'Record Key' is missing. Your CI provider is likely not passing private environment variables to builds from forks.

      These results will not be recorded.

      This error will not alter the exit code.
      """
    when "DASHBOARD_CANNOT_UPLOAD_RESULTS"
      """
      Warning: We encountered an error while uploading results from your run.

      These results will not be recorded.

      This error will not alter the exit code.

      #{arg1}
      """
    when "DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE"
      """
      Warning: We encountered an error talking to our servers.

      This run will not be recorded.

      This error will not alter the exit code.

      #{arg1}
      """
    when "DASHBOARD_RECORD_KEY_NOT_VALID"
      """
      Your Record Key #{chalk.yellow(arg1)} is not valid with this project: #{chalk.blue(arg2)}

      It may have been recently revoked by you or another user.

      Please log into the Dashboard to see the valid record keys.

      https://on.cypress.io/dashboard/projects/#{arg2}
      """
    when "DASHBOARD_PROJECT_NOT_FOUND"
      """
      We could not find a project with the ID: #{chalk.yellow(arg1)}

      This projectId came from your cypress.json file or an environment variable.

      Please log into the Dashboard and find your project.

      We will list the correct projectId in the 'Settings' tab.

      Alternatively, you can create a new project using the Desktop Application.

      https://on.cypress.io/dashboard
      """
    when "NO_PROJECT_ID"
      "Can't find 'projectId' in the 'cypress.json' file for this project: " + chalk.blue(arg1)
    when "NO_PROJECT_FOUND_AT_PROJECT_ROOT"
      "Can't find project at the path: " + chalk.blue(arg1)
    when "CANNOT_FETCH_PROJECT_TOKEN"
      "Can't find project's secret key."
    when "CANNOT_CREATE_PROJECT_TOKEN"
      "Can't create project's secret key."
    when "PORT_IN_USE_SHORT"
      "Port #{arg1} is already in use."
    when "PORT_IN_USE_LONG"
      """
      Can't run project because port is currently in use: #{chalk.blue(arg1)}

      #{chalk.yellow("Assign a different port with the '--port <port>' argument or shut down the other running process.")}
      """
    when "ERROR_READING_FILE"
      filePath = "`#{arg1}`"
      err = "`#{arg2}`"
      """
      Error reading from: #{chalk.blue(filePath)}

      #{chalk.yellow(err)}
      """
    when "ERROR_WRITING_FILE"
      filePath = "`#{arg1}`"
      err = "`#{arg2}`"
      """
      Error writing to: #{chalk.blue(filePath)}

      #{chalk.yellow(err)}
      """
    when "NO_SPECS_FOUND"
      ## no glob provided, searched all specs
      if not arg2
        """
        Can't run because no spec files were found.

        We searched for any files inside of this folder:

        #{chalk.blue(arg1)}
        """
      else
        """
        Can't run because no spec files were found.

        We searched for any files matching this glob pattern:

        #{chalk.blue(arg2)}
        """

    when "RENDERER_CRASHED"
      """
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

      https://on.cypress.io/renderer-process-crashed
      """
    when "AUTOMATION_SERVER_DISCONNECTED"
      "The automation client disconnected. Cannot continue running tests."
    when "SUPPORT_FILE_NOT_FOUND"
      """
      The support file is missing or invalid.

      Your `supportFile` is set to `#{arg1}`, but either the file is missing or it's invalid. The `supportFile` must be a `.js` or `.coffee` file or, if you're using a preprocessor plugin, it must be supported by that plugin.

      Correct your `cypress.json`, create the appropriate file, or set `supportFile` to `false` if a support file is not necessary for your project.

      Learn more at https://on.cypress.io/support-file-missing-or-invalid
      """
    when "PLUGINS_FILE_ERROR"
      msg = """
      The plugins file is missing or invalid.

      Your `pluginsFile` is set to `#{arg1}`, but either the file is missing, it contains a syntax error, or threw an error when required. The `pluginsFile` must be a `.js` or `.coffee` file.

      Please fix this, or set `pluginsFile` to `false` if a plugins file is not necessary for your project.
      """.trim()

      if arg2
        return {msg: msg, details: arg2}

      return msg
    when "PLUGINS_DIDNT_EXPORT_FUNCTION"
      msg = """
      The `pluginsFile` must export a function.

      We loaded the `pluginsFile` from: `#{arg1}`

      It exported:
      """

      return {msg: msg, details: JSON.stringify(arg2)}
    when "PLUGINS_FUNCTION_ERROR"
      msg = """
      The function exported by the plugins file threw an error.

      We invoked the function exported by `#{arg1}`, but it threw an error.
      """.trim()

      return {msg: msg, details: arg2}
    when "PLUGINS_ERROR"
      msg = """
      The following error was thrown by a plugin. We've stopped running your tests because a plugin crashed.
      """.trim()
      return {msg: msg, details: arg1}
    when "BUNDLE_ERROR"
      ## IF YOU MODIFY THIS MAKE SURE TO UPDATE
      ## THE ERROR MESSAGE IN THE RUNNER TOO
      """
      Oops...we found an error preparing this test file:

        #{chalk.blue(arg1)}

      The error was:

      #{chalk.yellow(arg2)}

      This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

      - A missing file or dependency
      - A syntax error in the file or one of its dependencies

      Fix the error in your code and re-run your tests.
      """
    when "SETTINGS_VALIDATION_ERROR"
      filePath = "`#{arg1}`"
      """
      We found an invalid value in the file: #{chalk.blue(filePath)}

      #{chalk.yellow(arg2)}
      """
    when "CONFIG_VALIDATION_ERROR"
      """
      We found an invalid configuration value:

      #{chalk.yellow(arg1)}
      """
    when "SCREENSHOT_ON_HEADLESS_FAILURE_REMOVED"
      """
      In Cypress v3.0.0 we removed the configuration option #{chalk.yellow('\`screenshotOnHeadlessFailure\`')}

      You now configure this behavior in your test code.

      Example:

      ```
      // cypress/support/index.js
      Cypress.Screenshot.defaults({
        screenshotOnRunFailure: false
      })
      ```

      Learn more at https://on.cypress.io/screenshot-api
      """
    when "RENAMED_CONFIG_OPTION"
      """
      A configuration option you have supplied has been renamed.

      Please rename #{chalk.yellow(arg1)} to #{chalk.blue(arg2)}
      """
    when "CANNOT_CONNECT_BASE_URL"
      """
      Cypress failed to verify that your server is running.

      Please start this server and then run Cypress again.
      """
    when "CANNOT_CONNECT_BASE_URL_WARNING"
      """
      Cypress could not verify that this server is running:

        > #{chalk.blue(arg1)}

      This server has been configured as your `baseUrl`, and tests will likely fail if it is not running.
      """
    when "CANNOT_CONNECT_BASE_URL_RETRYING"
      switch arg1.attempt
        when 1
          """
          Cypress could not verify that this server is running:

            > #{chalk.blue(arg1.baseUrl)}

          We are verifying this server because it has been configured as your `baseUrl`.

          Cypress automatically waits until your server is accessible before running tests.

          #{displayRetriesRemaining(arg1.remaining)}
          """
        else
          """
          #{displayRetriesRemaining(arg1.remaining)}
          """
    when "INVALID_REPORTER_NAME"
      """
      Could not load reporter by name: #{chalk.yellow(arg1.name)}

      We searched for the reporter in these paths:

      #{listItems(arg1.paths)}

      The error we received was:

      #{chalk.yellow(arg1.error)}

      Learn more at https://on.cypress.io/reporters
      """
    when "PROJECT_DOES_NOT_EXIST"
      """
      Could not find any tests to run.

      We looked but did not find a #{chalk.blue('cypress.json')} file in this folder: #{chalk.blue(arg1)}
      """
    when "INVOKED_BINARY_OUTSIDE_NPM_MODULE"
      """
      It looks like you are running the Cypress binary directly.

      This is not the recommended approach, and Cypress may not work correctly.

      Please install the 'cypress' NPM package and follow the instructions here:
      
      https://on.cypress.io/installing-cypress
      """
    when "DUPLICATE_TASK_KEY"
      """
      Warning: Multiple attempts to register the following task(s): #{chalk.blue(arg1)}. Only the last attempt will be registered.
      """
    when "FREE_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS"
      """
      You've exceeded the limit of private test recordings under your free plan this month. #{arg1.usedTestsMessage}

      To continue recording tests this month you must upgrade your account. Please visit your billing to upgrade to another billing plan.

      #{arg1.link}
      """
    when "FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_PRIVATE_TESTS"
      """
      You've exceeded the limit of private test recordings under your free plan this month. #{arg1.usedTestsMessage}

      Your plan is now in a grace period, which means your tests will still be recorded until #{arg1.gracePeriodMessage}. Please upgrade your plan to continue recording tests on the Cypress Dashboard in the future.

      #{arg1.link}
      """
    when "PAID_PLAN_EXCEEDS_MONTHLY_PRIVATE_TESTS"
      """
      You've exceeded the limit of private test recordings under your current billing plan this month. #{arg1.usedTestsMessage}

      To upgrade your account, please visit your billing to upgrade to another billing plan.

      #{arg1.link}
      """
    when "FREE_PLAN_EXCEEDS_MONTHLY_TESTS"
      """
      You've exceeded the limit of test recordings under your free plan this month. #{arg1.usedTestsMessage}

      To continue recording tests this month you must upgrade your account. Please visit your billing to upgrade to another billing plan.

      #{arg1.link}
      """
    when "FREE_PLAN_IN_GRACE_PERIOD_EXCEEDS_MONTHLY_TESTS"
      """
      You've exceeded the limit of test recordings under your free plan this month. #{arg1.usedTestsMessage}

      Your plan is now in a grace period, which means your tests will still be recorded until #{arg1.gracePeriodMessage}. Please upgrade your plan to continue recording tests on the Cypress Dashboard in the future.

      #{arg1.link}
      """
    when "PAID_PLAN_EXCEEDS_MONTHLY_TESTS"
      """
      You've exceeded the limit of test recordings under your current billing plan this month. #{arg1.usedTestsMessage}

      To upgrade your account, please visit your billing to upgrade to another billing plan.

      #{arg1.link}
      """
    when "FREE_PLAN_IN_GRACE_PERIOD_PARALLEL_FEATURE"
      """
      Parallelization is not included under your free plan.

      Your plan is now in a grace period, which means your tests will still run in parallel until #{arg1.gracePeriodMessage}. Please upgrade your plan to continue running your tests in parallel in the future.

      #{arg1.link}
      """
    when "PARALLEL_FEATURE_NOT_AVAILABLE_IN_PLAN"
      """
      Parallelization is not included under your current billing plan.

      To run your tests in parallel, please visit your billing and upgrade to another plan with parallelization.

      #{arg1.link}
      """
    when "PLAN_IN_GRACE_PERIOD_RUN_GROUPING_FEATURE_USED"
      """
      Grouping is not included under your free plan.

      Your plan is now in a grace period, which means your tests will still run with groups until #{arg1.gracePeriodMessage}. Please upgrade your plan to continue running your tests with groups in the future.

      #{arg1.link}
      """
    when "RUN_GROUPING_FEATURE_NOT_AVAILABLE_IN_PLAN"
      """
      Grouping is not included under your current billing plan.

      To run your tests with groups, please visit your billing and upgrade to another plan with grouping.

      #{arg1.link}
      """
    when "FIXTURE_NOT_FOUND"
      """
      A fixture file could not be found at any of the following paths:

       > #{arg1}
       > #{arg1}{{extension}}

      Cypress looked for these file extensions at the provided path:

       > #{arg2.join(', ')}

      Provide a path to an existing fixture file.
      """
    when "AUTH_COULD_NOT_LAUNCH_BROWSER"
      """
      Cypress was unable to open your installed browser. To continue logging in, please open this URL in your web browser:

      ```
      #{arg1}
      ```
      """
    when "AUTH_BROWSER_LAUNCHED"
      """
      Check your browser to continue logging in.
      """
    when "BAD_POLICY_WARNING"
      """
      Cypress detected policy settings on your computer that may cause issues.

      The following policies were detected that may prevent Cypress from automating Chrome:

       > #{arg1.join('\n > ')}

      For more information, see https://on.cypress.io/bad-browser-policy
      """
    when "BAD_POLICY_WARNING_TOOLTIP"
      """
      Cypress detected policy settings on your computer that may cause issues with using this browser. For more information, see https://on.cypress.io/bad-browser-policy
      """
    when "INVALID_CYPRESS_ENV"
      """
      We have detected unknown or unsupported CYPRESS_ENV value

        #{chalk.yellow(arg1)}

      Please do not modify CYPRESS_ENV value.
      """

get = (type, arg1, arg2) ->
  msg = getMsgByType(type, arg1, arg2)

  if _.isObject(msg)
    details = msg.details
    msg = msg.msg

  msg = trimMultipleNewLines(msg)

  err = new Error(msg)
  err.isCypressErr = true
  err.type = type
  err.details = details

  err

warning = (type, arg1, arg2) ->
  err = get(type, arg1, arg2)
  log(err, "magenta")
  
  return null

throwErr = (type, arg1, arg2) ->
  throw get(type, arg1, arg2)

clone = (err, options = {}) ->
  _.defaults options, {
    html: false
  }

  ## pull off these properties
  obj = _.pick(err, "type", "name", "stack", "fileName", "lineNumber", "columnNumber")

  if options.html
    obj.message = ansi_up.ansi_to_html(err.message, {
      use_classes: true
    })
  else
    obj.message = err.message

  ## and any own (custom) properties
  ## of the err object
  for own prop, val of err
    obj[prop] = val

  obj

log = (err, color = "red") ->
  console.log chalk[color](err.message)

  if err.details
    console.log("\n", chalk["yellow"](err.details))

  ## bail if this error came from known
  ## list of Cypress errors
  return if isCypressErr(err)

  console.log chalk[color](err.stack)

  return err
  
logException = Promise.method (err) ->
  ## TODO: remove context here
  if @log(err) and isProduction()
    ## log this exception since 
    ## its not a known error
    return require("./logger")
    .createException(err)
    .catch(->)
  
module.exports = {
  get,

  log,

  logException,

  clone,

  warning,

  # forms well-formatted user-friendly error for most common
  # errors Cypress can encounter
  getMsgByType,

  isCypressErr,

  throw: throwErr

  stripAnsi: strip
}
