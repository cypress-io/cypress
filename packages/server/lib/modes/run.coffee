_          = require("lodash")
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
fs         = require("../util/fs")
trash      = require("../util/trash")
random     = require("../util/random")
progress   = require("../util/progress_bar")
terminal   = require("../util/terminal")
specsUtil  = require("../util/specs")
humanTime  = require("../util/human_time")
electronApp = require("../util/electron_app")

haveProjectIdAndKeyButNoRecordOption = (projectId, options) ->
  ## if we have a project id
  ## and we have a key
  ## and (record or ci) hasn't been set to true or false
  (projectId and options.key) and (_.isUndefined(options.record) and _.isUndefined(options.ci))

collectTestResults = (obj = {}) ->
  {
    tests:       _.get(obj, 'stats.tests')
    passes:      _.get(obj, 'stats.passes')
    pending:     _.get(obj, 'stats.pending')
    failures:    _.get(obj, 'stats.failures')
    duration:    humanTime(_.get(obj, 'stats.duration'))
    screenshots: obj.screenshots and obj.screenshots.length
    video:       !!obj.video
    version:     pkg.version
  }

getProjectId = (project, id) ->
  ## if we have an ID just use it
  if id
    return Promise.resolve(id)

  project
  .getProjectId()
  .catch ->
    ## no id no problem
    return null

reduceRuns = (runs, prop) ->
  _.reduce runs, (memo, run) ->
    memo += _.get(run, prop)
  , 0

getRun = (run, prop) ->
  _.get(run, prop)

writeOutput = (outputPath, results) ->
  Promise.try ->
    return if not outputPath

    debug("saving output results as %s", outputPath)

    fs.outputJsonAsync(outputPath, results)

module.exports = {
  collectTestResults

  getProjectId

  writeOutput

  createOpenProject: (id, options) ->
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
    debug("ending the video recording:", name)

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

    openProject.launch(browser, spec.absolute, browserOpts)

  listenForProjectEnd: (project, headed, exit) ->
    new Promise (resolve) ->
      return if exit is false

      onEarlyExit = (errMsg) ->
        ## probably should say we ended
        ## early too: (Ended Early: true)
        ## in the stats
        obj = {
          error: errors.stripAnsi(errMsg)
          stats: {
            failures:     1
            tests:        0
            passes:       0
            pending:      0
            duration:     0
          }
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
    { project, headed, screenshots, started, end, name, cname, videoCompression, videoUploadOnPasses, exit, spec } = options

    @listenForProjectEnd(project, headed, exit)
    .then (obj) =>
      if end
        obj.video = name

      if screenshots
        obj.screenshots = screenshots

      obj.spec = spec?.path

      testResults = collectTestResults(obj)

      finish = ->
        return obj

      @displayStats(testResults)

      if screenshots and screenshots.length
        @displayScreenshots(screenshots)

      { tests, failures } = obj

      ## TODO: this is a interstitial modification to keep
      ## the logic the same but incrementally prepare for
      ## sending all the tests
      failingTests = _.filter(tests, { state: "failed" })

      hasFailingTests = failures > 0 and failingTests and failingTests.length

      ## if we have a video recording
      if started and tests and tests.length
        ## always set the video timestamp on tests
        obj.tests = Reporter.setVideoTimestamp(started, tests)

      ## TODO: temporary - remove later
      if started and failingTests and failingTests.length
        obj.failingTests = Reporter.setVideoTimestamp(started, failingTests)

      ## we should upload the video if we upload on passes (by default)
      ## or if we have any failures
      suv = !!(videoUploadOnPasses is true or hasFailingTests)

      ## TODO: remove this later
      obj.shouldUploadVideo = suv

      debug("attempting to close the browser")

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

  trashAssets: (config = {}) ->
    if config.trashAssetsBeforeHeadlessRuns is true
      Promise.join(
        trash.folder(config.videosFolder)
        trash.folder(config.screenshotsFolder)
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
      testTitle: data.titles
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

  runSpecs: (options = {}) ->
    { project, config, outputPath, specs } = options

    results = {
      startedTestsAt: null
      endedTestsAt: null
      totalDuration: null
      totalSuites: null,
      totalTests: null,
      totalFailures: null,
      totalPasses: null,
      totalPending: null,
      totalSkipped: null,
      runs: null
      browserName: 'chrome',
      browserVersion: '41.2.3.4',
      osName: 'darwin',
      osVersion: '1.2.3.4',
      cypressVersion: '2.0.0',
      config
    }

    runSpec = (spec) =>
      @runSpec(spec, options)
      .get("results")

    Promise.map(specs, runSpec, { concurrency: 1 })
    .then (runs = []) ->
      results.startedTestsAt = start = getRun(_.first(runs), "stats.start")
      results.endedTestsAt = end = getRun(_.last(runs), "stats.end")
      results.totalDuration = reduceRuns(runs, "stats.duration")

      results.totalSuites = reduceRuns(runs, "stats.suites")
      results.totalTests = reduceRuns(runs, "stats.tests")
      results.totalPasses = reduceRuns(runs, "stats.passes")
      results.totalPending = reduceRuns(runs, "stats.pending")
      results.totalFailures = reduceRuns(runs, "stats.failures")
      results.totalSkipped = reduceRuns(runs, "stats.skipped")

      results.runs = runs

      debug("final results of all runs: %o", results)

      writeOutput(outputPath, results)
      .return(results)

  runSpec: (spec = {}, options = {}) ->
    { browser, videoRecording, videosFolder } = options

    browser ?= "electron"
    debug("browser for run is: #{browser}")

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
        if not videosFolder
          throw new Error("Missing videoFolder for recording")

        name      = path.join(videosFolder, spec.name + ".mp4")
        cname     = path.join(videosFolder, spec.name + "-compressed.mp4")
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
          results: @waitForTestsToFinishRunning({
            end
            name
            spec
            cname
            started
            screenshots
            exit:                 options.exit
            headed:               options.headed
            project:              options.project
            videoCompression:     options.videoCompression
            videoUploadOnPasses:  options.videoUploadOnPasses
          }),

          connection: @waitForBrowserToConnect({
            spec
            write
            browser
            screenshots
            headed:      options.headed
            project:     options.project
            socketId:    options.socketId
            webSecurity: options.webSecurity
            projectPath: options.projectPath
          })
        })

  findSpecs: (config, spec) ->
    specsUtil.find(config, spec)
    .then (files = []) =>
      if not files.length
        errors.throw('NO_SPECS_FOUND', config.integrationFolder, spec)

      if debug.enabled
        names = _.map(files, "name")
        debug(
          "found '%d' specs using spec pattern '%s': %o",
          names.length,
          spec,
          names
        )

      return files

  ready: (options = {}) ->
    debug("run mode ready with options %j", options)

    socketId = random.id()

    { projectPath } = options

    ## let's first make sure this project exists
    Project
    .ensureExists(projectPath)
    .then =>
      ## open this project without
      ## adding it to the global cache
      @createOpenProject(socketId, options)
      .call("getProject")
    .then (project) =>
      Promise.all([
        project

        getProjectId(project, options.projectId)

        project.getConfig(),
      ])
    .spread (project, projectId, config) =>
      ## if we have a project id and a key but record hasnt
      ## been set
      if haveProjectIdAndKeyButNoRecordOption(projectId, options)
        ## log a warning telling the user
        ## that they either need to provide us
        ## with a RECORD_KEY or turn off
        ## record mode
        errors.warning("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", projectId)

      @findSpecs(config, options.spec)
      .then (specs) =>
        @trashAssets(config)
        .then =>
          @runSpecs({
            projectPath
            socketId
            project
            config
            specs
            videosFolder:         config.videosFolder
            videoRecording:       config.videoRecording
            videoCompression:     config.videoCompression
            videoUploadOnPasses:  config.videoUploadOnPasses
            exit:                 options.exit
            headed:               options.headed
            browser:              options.browser
            outputPath:           options.outputPath
          })
        .finally =>
          ## TODO: remove this
          @copy(config.videosFolder, config.screenshotsFolder)
          .then =>
            if options.allDone isnt false
              @allDone()

  run: (options) ->
    electronApp
    .ready()
    .then =>
      @ready(options)

}
