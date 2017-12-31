_          = require("lodash")
fs         = require("fs-extra")
uuid       = require("uuid")
path       = require("path")
chalk      = require("chalk")
human      = require("human-interval")
Promise    = require("bluebird")
pkg        = require("@packages/root")
debug      = require("debug")("cypress:server:run")
ss         = require("../screenshots")
user       = require("../user")
stats      = require("../stats")
video      = require("../video")
errors     = require("../errors")
Project    = require("../project")
Reporter   = require("../reporter")
openProject = require("../open_project")
Windows    = require("../gui/windows")
trash      = require("../util/trash")
random     = require("../util/random")
progress   = require("../util/progress_bar")
terminal   = require("../util/terminal")
humanTime  = require("../util/human_time")
electronApp = require("../util/electron_app")

fs = Promise.promisifyAll(fs)

TITLE_SEPARATOR = " /// "

haveProjectIdAndKeyButNoRecordOption = (projectId, options) ->
  ## if we have a project id
  ## and we have a key
  ## and (record or ci) hasn't been set to true or false
  (projectId and options.key) and (_.isUndefined(options.record) and _.isUndefined(options.ci))

collectTestResults = (obj) ->
  {
    tests:       obj.tests
    passes:      obj.passes
    pending:     obj.pending
    failures:    obj.failures
    duration:    humanTime(obj.duration)
    screenshots: obj.screenshots and obj.screenshots.length
    video:       !!obj.video
    version:     pkg.version
  }

module.exports = {
  collectTestResults

  getProjectId: (project, id) ->
    ## if we have an ID just use it
    if id
      return Promise.resolve(id)

    project
    .getProjectId()
    .catch ->
      ## no id no problem
      return null

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
      onError: (err) ->
        console.log()
        console.log(err.stack)
        openProject.emit("exitEarlyWithErr", err.message)
    })
    .catch {portInUse: true}, (err) ->
      ## TODO: this needs to move to emit exitEarly
      ## so we record the failure in CI
      errors.throw("PORT_IN_USE_LONG", err.port)

  createRecording: (name) ->
    outputDir = path.dirname(name)

    fs.ensureDirAsync(outputDir)
    .then ->
      console.log("\nStarted video recording: #{chalk.cyan(name)}\n")

      video.start(name, {
        onError: (err) ->
          ## catch video recording failures and log them out
          ## but don't let this affect the run at all
          errors.warning("VIDEO_RECORDING_FAILED", err.stack)
      })

  getElectronProps: (showGui, project, write) ->
    obj = {
      width:  1280
      height: 720
      show:   showGui
      onCrashed: ->
        err = errors.get("RENDERER_CRASHED")
        errors.log(err)

        project.emit("exitEarlyWithErr", err.message)
      onNewWindow: (e, url, frameName, disposition, options) ->
        ## force new windows to automatically open with show: false
        ## this prevents window.open inside of javascript client code
        ## to cause a new BrowserWindow instance to open
        ## https://github.com/cypress-io/cypress/issues/123
        options.show = false
    }

    if write
      obj.recordFrameRate = 20
      obj.onPaint = (event, dirty, image) ->
        write(image.toJPEG(100))

    obj

  displayStats: (obj = {}) ->
    bgColor = if obj.failures then "bgRed" else "bgGreen"
    color   = if obj.failures then "red"   else "green"

    console.log("")

    terminal.header("Tests Finished", {
      color: [color]
    })

    console.log("")

    stats.display(color, obj)

  displayScreenshots: (screenshots = []) ->
    console.log("")
    console.log("")

    terminal.header("Screenshots", {color: ["yellow"]})

    console.log("")

    format = (s) ->
      dimensions = chalk.gray("(#{s.width}x#{s.height})")

      "  - #{s.path} #{dimensions}"

    screenshots.forEach (screenshot) ->
      console.log(format(screenshot))

  postProcessRecording: (end, name, cname, videoCompression, shouldUploadVideo) ->
    ## once this ended promises resolves
    ## then begin processing the file
    end()
    .then ->
      ## dont process anything if videoCompress is off
      ## or we've been told not to upload the video
      return if videoCompression is false or shouldUploadVideo is false

      console.log("")
      console.log("")

      terminal.header("Video", {
        color: ["cyan"]
      })

      console.log("")

      # bar = progress.create("Post Processing Video")
      console.log("  - Started processing:  ", chalk.cyan("Compressing to #{videoCompression} CRF"))

      started  = new Date
      progress = Date.now()
      tenSecs = human("10 seconds")

      onProgress = (float) ->
        switch
          when float is 1
            finished = new Date - started
            duration = "(#{humanTime(finished)})"
            console.log("  - Finished processing: ", chalk.cyan(name), chalk.gray(duration))

          when (new Date - progress) > tenSecs
            ## bump up the progress so we dont
            ## continuously get notifications
            progress += tenSecs
            percentage = Math.ceil(float * 100) + "%"
            console.log("  - Compression progress: ", chalk.cyan(percentage))

        # bar.tickTotal(float)

      video.process(name, cname, videoCompression, onProgress)
    .catch {recordingVideoFailed: true}, (err) ->
      ## dont do anything if this error occured because
      ## recording the video had already failed
      return
    .catch (err) ->
      ## log that post processing was attempted
      ## but failed and dont let this change the run exit code
      errors.warning("VIDEO_POST_PROCESSING_FAILED", err.stack)

  launchBrowser: (options = {}) ->
    { browser, spec, write, headed, project, screenshots } = options

    headed = !!headed

    browser ?= "electron"

    browserOpts = switch browser
      when "electron"
        @getElectronProps(headed, project, write)
      else
        {}

    browserOpts.automationMiddleware = {
      onAfterResponse: (message, data, resp) =>
        if message is "take:screenshot"
          screenshots.push @screenshotMetadata(data, resp)

        resp
    }

    browserOpts.projectPath = options.projectPath

    openProject.launch(browser, spec, browserOpts)

  listenForProjectEnd: (project, headed, exit) ->
    new Promise (resolve) ->
      return if exit is false

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
    { project, socketId, timeout } = options

    attempts = 0

    do waitForBrowserToConnect = =>
      Promise.join(
        @waitForSocketConnection(project, socketId)
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
          project.removeListener("socket:connected", fn)

          ## resolve the promise
          resolve()

      ## when a socket connects verify this
      ## is the one that matches our id!
      project.on("socket:connected", fn)

  waitForTestsToFinishRunning: (options = {}) ->
    { project, headed, screenshots, started, end, name, cname, videoCompression, videoUploadOnPasses, outputPath, exit } = options

    @listenForProjectEnd(project, headed, exit)
    .then (obj) =>
      if end
        obj.video = name

      if screenshots
        obj.screenshots = screenshots

      testResults = collectTestResults(obj)

      writeOutput = ->
        if not outputPath
          return Promise.resolve()

        debug("saving results as %s", outputPath)

        fs.outputJsonAsync(outputPath, testResults)

      finish = ->
        writeOutput()
        .then ->
          project.getConfig()
        .then (cfg) ->
          obj.config = cfg
        .return(obj)

      @displayStats(testResults)

      if screenshots and screenshots.length
        @displayScreenshots(screenshots)

      ft = obj.failingTests

      hasFailingTests = ft and ft.length

      if hasFailingTests
        obj.failingTests = Reporter.setVideoTimestamp(started, ft)

      ## we should upload the video if we upload on passes (by default)
      ## or if we have any failures
      suv = obj.shouldUploadVideo = !!(videoUploadOnPasses is true or hasFailingTests)

      ## always close the browser now as opposed to letting
      ## it exit naturally with the parent process due to
      ## electron bug in windows
      openProject.closeBrowser()
      .then =>
        if end
          @postProcessRecording(end, name, cname, videoCompression, suv)
          .then(finish)
          ## TODO: add a catch here
        else
          finish()

  trashAssets: (options = {}) ->
    if options.trashAssetsBeforeHeadlessRuns is true
      Promise.join(
        trash.folder(options.videosFolder)
        trash.folder(options.screenshotsFolder)
      )
      .catch (err) ->
        ## dont make trashing assets fail the build
        errors.warning("CANNOT_TRASH_ASSETS", err.stack)
    else
      Promise.resolve()

  screenshotMetadata: (data, resp) ->
    {
      clientId:  uuid.v4()
      title:      data.name ## TODO: rename this property
      # name:      data.name
      testId:    data.testId
      testTitle: data.titles.join(TITLE_SEPARATOR)
      path:      resp.path
      height:    resp.height
      width:     resp.width
    }

  copy: (videosFolder, screenshotsFolder) ->
    Promise.try ->
      ## dont attempt to copy if we're running in circle and we've turned off copying artifacts
      shouldCopy = (ca = process.env.CIRCLE_ARTIFACTS) and process.env["COPY_CIRCLE_ARTIFACTS"] isnt "false"

      debug("Should copy Circle Artifacts?", Boolean(shouldCopy))

      if shouldCopy and videosFolder and screenshotsFolder
        debug("Copying Circle Artifacts", ca, videosFolder, screenshotsFolder)

        ## copy each of the screenshots and videos
        ## to artifacts using each basename of the folders
        Promise.join(
          ss.copy(
            screenshotsFolder,
            path.join(ca, path.basename(screenshotsFolder))
          ),
          video.copy(
            videosFolder,
            path.join(ca, path.basename(videosFolder))
          )
        )

  allDone: ->
    console.log("")
    console.log("")

    terminal.header("All Done", {
      color: ["gray"]
    })

    console.log("")

  runTests: (options = {}) ->
    { browser, videoRecording, videosFolder } = options
    debug("runTests with options", options)

    browser ?= "electron"
    debug("runTests for browser #{browser}")

    screenshots = []

    ## we know we're done running headlessly
    ## when the renderer has connected and
    ## finishes running all of the tests.
    ## we're using an event emitter interface
    ## to gracefully handle this in promise land

    ## if we've been told to record and we're not spawning a headed browser
    browserCanBeRecorded = (name) ->
      name is "electron" and not options.headed

    if videoRecording
      if browserCanBeRecorded(browser)
        if !videosFolder
          throw new Error("Missing videoFolder for recording")

        id2       = random.id()
        name      = path.join(videosFolder, id2 + ".mp4")
        cname     = path.join(videosFolder, id2 + "-compressed.mp4")
        recording = @createRecording(name)
      else
        if browser is "electron" and options.headed
          errors.warning("CANNOT_RECORD_VIDEO_HEADED")
        else
          errors.warning("CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER", browser)

    Promise.resolve(recording)
    .then (props = {}) =>
      ## extract the started + ended promises from recording
      {start, end, write} = props

      terminal.header("Tests Starting", {color: ["gray"]})

      ## make sure we start the recording first
      ## before doing anything
      Promise.resolve(start)
      .then (started) =>
        Promise.props({
          stats:      @waitForTestsToFinishRunning({
            exit:                 options.exit
            headed:               options.headed
            project:              options.project
            videoCompression:     options.videoCompression
            videoUploadOnPasses:  options.videoUploadOnPasses
            outputPath:           options.outputPath
            end
            name
            cname
            started
            screenshots
          }),

          connection: @waitForBrowserToConnect({
            spec:        options.spec
            headed:      options.headed
            project:     options.project
            socketId:    options.socketId
            webSecurity: options.webSecurity
            projectPath: options.projectPath
            write
            browser
            screenshots
          })
        })

  ready: (options = {}) ->
    debug("run mode ready with options %j", options)

    if options.spec
      debug("spec pattern given", options.spec)

    socketId = random.id()

    { projectPath } = options

    ## let's first make sure this project exists
    Project.ensureExists(projectPath)
    .then =>
      ## open this project without
      ## adding it to the global cache
      @openProject(socketId, options)
      .call("getProject")
      .then (project) =>
        Promise.all([
          @getProjectId(project, options.projectId)

          project.getConfig(),
        ])
        .spread (projectId, config) =>
          ## if we have a project id and a key but record hasnt
          ## been set
          if haveProjectIdAndKeyButNoRecordOption(projectId, options)
            ## log a warning telling the user
            ## that they either need to provide us
            ## with a RECORD_KEY or turn off
            ## record mode
            errors.warning("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", projectId)

          @trashAssets(config)
          .then =>
            @runTests({
              projectPath
              socketId:             socketId
              project:              project
              videosFolder:         config.videosFolder
              videoRecording:       config.videoRecording
              videoCompression:     config.videoCompression
              videoUploadOnPasses:  config.videoUploadOnPasses
              exit:                 options.exit
              spec:                 options.spec
              headed:               options.headed
              browser:              options.browser
              outputPath:           options.outputPath
            })
          .get("stats")
          .finally =>
            @copy(config.videosFolder, config.screenshotsFolder)
            .then =>
              if options.allDone isnt false
                @allDone()

  run: (options) ->
    electronApp()
    .ready()
    .then =>
      @ready(options)

}
