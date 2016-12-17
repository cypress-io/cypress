_       = require("lodash")
strip   = require("strip-ansi")
chalk   = require("chalk")
ansi_up = require("ansi_up")
Promise = require("bluebird")

API = {
  getMsgByType: (type, arg1, arg2) ->
    switch type
      when "CANNOT_TRASH_ASSETS"
        "Warning: We failed to trash the existing build assets.\n\nThis error will not alter the exit code.\n\n#{arg1}"
      when "VIDEO_RECORDING_FAILED"
        "Warning: We failed to record the video.\n\nThis error will not alter the exit code.\n\n#{arg1}"
      when "VIDEO_POST_PROCESSING_FAILED"
        "Warning: We failed processing this video.\n\nThis error will not alter the exit code.\n\n#{arg1}"
      when "NOT_LOGGED_IN"
        "You're not logged in.\n\nRun `cypress open` to open the Desktop App and login."
      when "TESTS_DID_NOT_START_RETRYING"
        "Timed out waiting for the browser to connect. #{arg1}"
      when "TESTS_DID_NOT_START_FAILED"
        "The browser never connected. Something is wrong. The tests cannot run. Aborting..."
      when "PROJECT_DOES_NOT_EXIST"
        "You need to add a project to run tests."
      when "CI_CANNOT_UPLOAD_ASSETS"
        "Warning: We encountered an error while uploading your build assets.\n\nThese build assets will not be recorded\n\nThis error will not alter or the exit code.\n\n#{arg1}"
      when "CI_CANNOT_CREATE_BUILD_OR_INSTANCE"
        "Warning: We encountered an error talking to our servers.\n\nNo build assets will be recorded.\n\nThis error will not alter the exit code.\n\n#{arg1}"
      when "CI_KEY_MISSING"
        "Can't run in CI without a CI key. You did not provide one."
      when "CI_KEY_NOT_VALID"
        "Can't run project in CI. Your project's CI key: #{chalk.blue(arg1)} is invalid."
      when "CI_PROJECT_NOT_FOUND"
        "Can't find project. Aborting the CI run.\n\nCheck that your 'projectId' and 'secret CI key' are valid."
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
        "Can't run project because port is currently in use: " + chalk.blue(arg1) + "\n\n" + chalk.yellow("Assign a different port with the '--port <port>' argument or shut down the other running process.")
      when "ERROR_READING_FILE"
        "Error reading from: " + chalk.blue(arg1) + "\n\n" + chalk.yellow(arg2)
      when "ERROR_WRITING_FILE"
        "Error writing to: " + chalk.blue(arg1) + "\n\n" + chalk.yellow(arg2)
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
        "The automation server disconnected. Cannot continue running tests."
      when "SUPPORT_FILE_NOT_FOUND"
        """
        Support file missing or invalid

        Your supportFile is set to '#{arg1}', but either the file is missing or it's invalid. The supportFile must be a .js or .coffee file.

        Correct your cypress.json or create the appropriate file.

        Learn more at https://on.cypress.io/support-file-missing-or-invalid
        """
      when "BUNDLE_ERROR"
        ## IF YOU MODIFY THIS MAKE SURE TO UPDATE
        ## THE ERROR MESSAGE IN THE RUNNER TOO
        """
        Oops...we found an error preparing this test file:

          #{chalk.blue(arg1)}

        The error was:

        #{chalk.yellow(arg2)}

        This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

        * A missing file or dependency
        * A syntax error in the file or one of its dependencies

        Fix the error in your code and re-run your tests.
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

  throw: (type, arg) ->
    throw @get(type, arg)

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
