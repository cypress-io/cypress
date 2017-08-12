fs         = require("fs-extra")
Promise    = require("bluebird")
random     = require("randomstring")
stats      = require("../stats")
errors     = require("../errors")
Project    = require("../project")
Reporter   = require("../reporter")
openProject = require("../open_project")
terminal   = require("../util/terminal")
humanTime  = require("../util/human_time")
pkg        = require("../../package.json")
log        = require("../log")

fs = Promise.promisifyAll(fs)

collectTestResults = (obj) ->
  {
    tests:       obj.tests
    passes:      obj.passes
    pending:     obj.pending
    failures:    obj.failures
    duration:    humanTime(obj.duration)
    version:     pkg.version
  }

module.exports = {
  collectTestResults

  getId: ->
    ## return a random id
    random.generate({
      length: 5
      capitalization: "lowercase"
    })

  openProject: (id, options) ->
    ## now open the project to boot the server
    ## putting our web client app in headless mode
    ## - NO  display server logs (via morgan)
    ## - YES display reporter results (via mocha reporter)
    openProject.create(options.projectPath, options, {
      morgan:       false
      socketId:     id
      report:       true
      isTextTerminal:   options.isTextTerminal ? true
    })
    .catch {portInUse: true}, (err) ->
      ## TODO: this needs to move to emit exitEarly
      ## so we record the failure in CI
      errors.throw("PORT_IN_USE_LONG", err.port)

  displayStats: (obj = {}) ->
    bgColor = if obj.failures then "bgRed" else "bgGreen"
    color   = if obj.failures then "red"   else "green"

    console.log("")

    terminal.header("Tests Finished", {
      color: [color]
    })

    console.log("")

    stats.display(color, obj)

  launchBrowser: (options = {}) ->
    { browser, spec } = options

    browserOpts = {}

    openProject.launch(browser, spec, browserOpts)

  listenForProjectEnd: (project, gui) ->
    new Promise (resolve) ->
      ## dont ever end if we're in 'gui' debugging mode
      return if gui

      onEarlyExit = (errMsg) ->
        ## probably should say we ended
        ## early too: (Ended Early: true)
        ## in the stats
        obj = {
          error:        errors.stripAnsi(errMsg)
          failures:     1
          tests:        0
          passes:       0
          pending:      0
          duration:     0
          failingTests: []
        }

        resolve(obj)

      onEnd = (obj) =>
        resolve(obj)

      ## when our project fires its end event
      ## resolve the promise
      project.once("end", onEnd)
      project.once("exitEarlyWithErr", onEarlyExit)

  waitForBrowserToConnect: (options = {}) ->
    { project, id, timeout } = options

    attempts = 0

    do waitForBrowserToConnect = =>
      Promise.join(
        @waitForSocketConnection(project, id)
        @launchBrowser(options)
      )
      .timeout(timeout ? 30000)
      .catch Promise.TimeoutError, (err) =>
        attempts += 1

        console.log("")

        ## always first close the open browsers
        ## before retrying or dieing
        openProject.closeBrowser()
        .then ->
          switch attempts
            ## try again up to 3 attempts
            when 1, 2
              word = if attempts is 1 then "Retrying..." else "Retrying again..."
              errors.warning("TESTS_DID_NOT_START_RETRYING", word)

              waitForBrowserToConnect()

            else
              err = errors.get("TESTS_DID_NOT_START_FAILED")
              errors.log(err)

              project.emit("exitEarlyWithErr", err.message)

  waitForSocketConnection: (project, id) ->
    new Promise (resolve, reject) ->
      fn = (socketId) ->
        if socketId is id
          ## remove the event listener if we've connected
          project.removeListener "socket:connected", fn

          ## resolve the promise
          resolve()

      ## when a socket connects verify this
      ## is the one that matches our id!
      project.on "socket:connected", fn

  waitForTestsToFinishRunning: (options = {}) ->
    { project, gui, started } = options

    @listenForProjectEnd(project, gui)
    .then (obj) =>
      testResults = collectTestResults(obj)

      finish = ->
        project
        .getConfig()
        .then (cfg) ->
          obj.config = cfg
        .return(obj)

      @displayStats(testResults)

      finish()

  allDone: ->
    console.log("")
    console.log("")

    terminal.header("All Done", {
      color: ["gray"]
    })

    console.log("")

  runTests: (options = {}) ->
    { browser } = options

    log("runTests with options %j", Object.keys(options))

    log "runTests for browser #{browser}"

    ## we know we're done running headlessly
    ## when the renderer has connected and
    ## finishes running all of the tests.
    ## we're using an event emitter interface
    ## to gracefully handle this in promise land

    ## if we've been told to record and we're not spawning a headed browser
    terminal.header("Tests Starting", {color: ["gray"]})

    ## make sure we start the recording first
    ## before doing anything
    Promise.props({
      stats:      @waitForTestsToFinishRunning({
        project:          options.project
      }),

      connection: @waitForBrowserToConnect({
        id:          options.id
        spec:        options.spec
        project:     options.project
        webSecurity: options.webSecurity
        browser
      })
    })

  run: (options) ->
    log("driver mode ready with options %j", Object.keys(options))

    id = @getId()

    ## verify this is an added project
    ## and then open it, returning our
    ## project instance
    @openProject(id, options)
    .call("getProject")
    .then (project) =>
      project.getConfig()
      .then (config) =>
        @runTests({
          id:               id
          project:          project
          videosFolder:     config.videosFolder
          videoRecording:   config.videoRecording
          videoCompression: config.videoCompression
          spec:             options.spec
          gui:              options.showHeadlessGui
          browser:          options.browser
          outputPath:       options.outputPath
        })
      .get("stats")
      .finally =>
        @allDone()
}
