_       = require("lodash")
strip   = require("strip-ansi")
chalk   = require("chalk")
ansi_up = require("ansi_up")
Promise = require("bluebird")

listPaths = (paths) ->
  _.map paths, (p) ->
    "- " + chalk.yellow(p)

API = {
  # forms well-formatted user-friendly error for most common
  # errors Cypress can encounter
  getMsgByType: (type, arg1, arg2) ->
    switch type
      when "CANNOT_TRASH_ASSETS"
        """
        Warning: We failed to trash the existing run results.

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
      when "BROWSER_NOT_FOUND"
        """
        Browser: '#{arg1}' was not found on your system.

        Available browsers found are: #{arg2}
        """
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

        Run `cypress open` to open the Desktop App and login.
        """
      when "TESTS_DID_NOT_START_RETRYING"
        "Timed out waiting for the browser to connect. #{arg1}"
      when "TESTS_DID_NOT_START_FAILED"
        "The browser never connected. Something is wrong. The tests cannot run. Aborting..."
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
      when "DASHBOARD_CANNOT_UPLOAD_RESULTS"
        """
        Warning: We encountered an error while uploading results from your run.

        These results will not be recorded.

        This error will not alter or the exit code.

        #{arg1}
        """
      when "DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE"
        """
        Warning: We encountered an error talking to our servers.

        This run will not be recorded.

        This error will not alter the exit code.

        #{arg1}
        """
      when "RECORD_KEY_NOT_VALID"
        """
        We failed trying to authenticate this project.

        Your Record Key is invalid: #{chalk.yellow(arg1)}

        It may have been recently revoked by you or another user.

        Please log into the Dashboard to see the updated token.

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
      when "DEV_NO_SERVER"
        " > The local API server isn't running in development. This may cause problems running the GUI."
      when "NO_PROJECT_ID"
        "Can't find 'projectId' in the 'cypress.json' file for this project: " + chalk.blue(arg1)
      when "NO_PROJECT_FOUND_AT_PROJECT_ROOT"
        "Can't find project at the path: " + chalk.blue(arg1)
      when "CANNOT_FETCH_PROJECT_TOKEN"
        "Can't find project's secret key."
      when "CANNOT_CREATE_PROJECT_TOKEN"
        "Can't create project's secret key."
      when "PORT_IN_USE_SHORT"
        "Port '#{arg1}' is already in use."
      when "PORT_IN_USE_LONG"
        """
        Can't run project because port is currently in use: #{chalk.blue(arg1)}

        #{chalk.yellow("Assign a different port with the '--port <port>' argument or shut down the other running process.")}
        """
      when "ERROR_READING_FILE"
        """
        Error reading from: #{chalk.blue(arg1)}

        #{chalk.yellow(arg2)}
        """
      when "ERROR_WRITING_FILE"
        """
        Error writing to: #{chalk.blue(arg1)}

        #{chalk.yellow(arg2)}
        """
      when "SPEC_FILE_NOT_FOUND"
        "Can't find test spec: " + chalk.blue(arg1)
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
      when "NO_CURRENTLY_OPEN_PROJECT"
        "Can't find open project."
      when "AUTOMATION_SERVER_DISCONNECTED"
        "The automation client disconnected. Cannot continue running tests."
      when "SUPPORT_FILE_NOT_FOUND"
        """
        The support file is missing or invalid.

        Your supportFile is set to '#{arg1}', but either the file is missing or it's invalid. The supportFile must be a .js or .coffee file.

        Correct your cypress.json, create the appropriate file, or set supportFile to false if a support file is not necessary for your project.

        Learn more at https://on.cypress.io/support-file-missing-or-invalid
        """
      when "PLUGINS_FILE_ERROR"
        """
        The plugins file is missing or invalid.

        Your pluginsFile is set to '#{arg1}', but either the file is missing, it contains a syntax error, or threw an error when required. The pluginsFile must be a .js or .coffee file.

        Correct your cypress.json, create or fix the file, or set pluginsFile to false if a plugins file is not necessary for your project.

        Learn more at https://on.cypress.io/plugins-file-missing-or-invalid

        #{if arg2 then "The following error was thrown:" else ""}

        #{if arg2 then chalk.yellow(arg2) else ""}
        """.trim()
      when "PLUGINS_FUNCTION_ERROR"
        """
        The function exported by the plugins file threw an error.

        We invoked the function exported by '#{arg1}', but it threw an error.

        This is likely an error in the code of the plugins file itself.

        #{chalk.yellow(arg2)}
        """.trim()
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
      when "CONFIG_VALIDATION_ERROR"
        """
        We found an invalid value in the file: '#{chalk.blue(arg1)}'

        #{chalk.yellow(arg2)}
        """
      when "CANNOT_CONNECT_BASE_URL"
        """
        Cypress could not verify that the server set as your 'baseUrl' is running:

          > #{chalk.blue(arg1)}

        Your tests likely make requests to this 'baseUrl' and these tests will fail if you don't boot your server.

        Please start this server and then run Cypress again.
        """
      when "CANNOT_CONNECT_BASE_URL_WARNING"
        """
        Cypress could not verify that the server set as your 'baseUrl' is running: #{arg1}

        Your tests likely make requests to this 'baseUrl' and these tests will fail if you don't boot your server.
        """
      when "INVALID_REPORTER_NAME"
        """
        Could not load reporter by name: #{chalk.yellow(arg1)}

        We searched for the reporter in these paths:

        #{listPaths(arg2).join("\n")}

        Learn more at https://on.cypress.io/reporters
        """
      when "PROJECT_DOES_NOT_EXIST"
        """
        Could not find any tests to run.

        We looked but did not find a #{chalk.blue('cypress.json')} file in this folder: #{chalk.blue(arg1)}
        """

  get: (type, arg1, arg2) ->
    msg = @getMsgByType(type, arg1, arg2)
    err = new Error(msg)
    err.type = type
    err

  isCypressErr: (err) ->
    ## if we have a type
    err.type and

      ## and its found in our list of errors
      @getMsgByType(err.type)

  warning: (type, arg) ->
    err = @get(type, arg)
    @log(err, "magenta")

  log: (err, color = "red") ->
    Promise.try =>
      console.log chalk[color](err.message)

      ## bail if this error came from known
      ## list of Cypress errors
      return if @isCypressErr(err)

      console.log chalk[color](err.stack)

      if process.env["CYPRESS_ENV"] is "production"
        ## log this error to raygun since its not
        ## a known error
        require("./logger").createException(err).catch(->)

  throw: (type, arg1, arg2) ->
    throw @get(type, arg1, arg2)

  stripAnsi: strip

  clone: (err, options = {}) ->
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
}

module.exports = _.bindAll(API, _.functions(API))
