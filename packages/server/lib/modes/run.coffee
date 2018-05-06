_          = require("lodash")
uuid       = require("uuid")
path       = require("path")
chalk      = require("chalk")
human      = require("human-interval")
Promise    = require("bluebird")
pkg        = require("@packages/root")
debug      = require("debug")("cypress:server:run")
recordMode = require("./record")
user       = require("../user")
stats      = require("../stats")
video      = require("../video")
errors     = require("../errors")
stdout     = require("../stdout")
Project    = require("../project")
Reporter   = require("../reporter")
openProject = require("../open_project")
Windows    = require("../gui/windows")
fs         = require("../util/fs")
env        = require("../util/env")
trash      = require("../util/trash")
random     = require("../util/random")
progress   = require("../util/progress_bar")
terminal   = require("../util/terminal")
specsUtil  = require("../util/specs")
humanTime  = require("../util/human_time")
electronApp = require("../util/electron_app")

collectTestResults = (obj = {}) ->
  {
    tests:       _.get(obj, 'stats.tests')
    passes:      _.get(obj, 'stats.passes')
    pending:     _.get(obj, 'stats.pending')
    failures:    _.get(obj, 'stats.failures')
    duration:    humanTime(_.get(obj, 'stats.duration'))
    screenshots: obj.screenshots and obj.screenshots.length
    video:       Boolean(obj.video)
    version:     pkg.version
  }

allDone = ->
  stdout.restore()

  console.log("")
  console.log("")

  terminal.header("All Done", {
    color: ["gray"]
  })

  console.log("")

getProjectId = (project, id) ->
  id ?= env.get("CYPRESS_PROJECT_ID")

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

openProjectCreate = (projectRoot, socketId, options) ->
  ## now open the project to boot the server
  ## putting our web client app in headless mode
  ## - NO  display server logs (via morgan)
  ## - YES display reporter results (via mocha reporter)
  openProject.create(projectRoot, options, {
    socketId
    morgan:       false
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

createAndOpenProject = (socketId, options) ->
  { projectRoot, projectId } = options

  Project
  .ensureExists(projectRoot)
  .then ->
    ## open this project without
    ## adding it to the global cache
    openProjectCreate(projectRoot, socketId, options)
    .call("getProject")
  .then (project) ->
    Promise.props({
      project
      config: project.getConfig()
      projectId: getProjectId(project, projectId)
    })

module.exports = {
  collectTestResults

  getProjectId

  writeOutput

  openProjectCreate

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

    browserOpts.projectRoot = options.projectRoot

    openProject.launch(browser, spec.absolute, browserOpts)

  listenForProjectEnd: (project, headed, exit) ->
    new Promise (resolve) ->
      if exit is false
        resolve = (arg) ->
          console.log("not exiting due to options.exit being false")

      onEarlyExit = (errMsg) ->
        ## probably should say we ended
        ## early too: (Ended Early: true)
        ## in the stats
        obj = {
          error: errors.stripAnsi(errMsg)
          stats: {
            failures: 1
            tests: 0
            passes: 0
            pending: 0
            suites: 0
            skipped: 0
            wallClockDuration: 0
            wallClockStartedAt: (new Date()).toJSON()
            wallClockEndedAt: (new Date()).toJSON()
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
    { config, project, headed, screenshots, started, end, name, cname, videoCompression, videoUploadOnPasses, exit, spec } = options

    @listenForProjectEnd(project, headed, exit)
    .then (obj) =>
      _.defaults(obj, {
        error: null
        hooks: null
        tests: null
        video: null
        screenshots: null
        reporterStats: null
      })

      if end
        obj.video = name

      if screenshots
        obj.screenshots = screenshots

      obj.spec = spec?.path
      obj.config = config

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
    ## TODO: update all of these properties
    ## because we have a full array of tests
    ## no need for testTitle
    {
      screenshotId:  random.id()
      name:      data.name ? null
      testId:    data.testId
      takenAt:   resp.takenAt
      path:      resp.path
      height:    resp.height
      width:     resp.width
    }

  runSpecs: (options = {}) ->
    { project, config, outputPath, specs, beforeSpecRun, afterSpecRun } = options

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

    runEachSpec = (spec) =>
      Promise
      .try ->
        if beforeSpecRun
          beforeSpecRun(spec)
      .then =>
        @runSpec(spec, options)
      .get("results")
      .tap (results) ->
        if afterSpecRun
          afterSpecRun(results)

    Promise.mapSeries(specs, runEachSpec)
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
    { config, browser, videoRecording, videosFolder } = options

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
            config
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
            projectRoot: options.projectRoot
          })
        })

  findSpecs: (config, specPattern) ->
    specsUtil.find(config, specPattern)
    .tap (files = []) =>
      if debug.enabled
        names = _.map(files, "name")
        debug(
          "found '%d' specs using spec pattern '%s': %o",
          names.length,
          specPattern,
          names
        )

  ready: (options = {}) ->
    debug("run mode ready with options %j", options)

    _.defaults(options, {
      browser: "electron"
    })

    socketId = random.id()

    { projectRoot, record, key, browser } = options

    ## alias and coerce to null
    specPattern = options.spec ? null

    if record
      captured = stdout.capture()

    ## warn if we're using deprecated --ci flag
    recordMode.warnIfCiFlag(options.ci)

    ## ensure the project exists
    ## and open up the project
    createAndOpenProject(socketId, options)
    .then ({ project, projectId, config }) =>
      ## if we have a project id and a key but record hasnt been given
      recordMode.warnIfProjectIdButNoRecordOption(projectId, options)

      if record
        recordMode.throwIfNoProjectId(projectId)

      @findSpecs(config, specPattern)
      .then (specs = []) =>
        ## return only what is return to the specPattern
        if specPattern
          specPattern = specsUtil.getPatternRelativeToProjectRoot(specPattern, projectRoot)

        runAllSpecs = (beforeSpecRun, afterSpecRun) =>
          if not specs.length
            errors.throw('NO_SPECS_FOUND', config.integrationFolder, specPattern)

          @trashAssets(config)
          .then =>
            @runSpecs({
              beforeSpecRun
              afterSpecRun
              projectRoot
              socketId
              browser
              project
              config
              specs
              videosFolder:         config.videosFolder
              videoRecording:       config.videoRecording
              videoCompression:     config.videoCompression
              videoUploadOnPasses:  config.videoUploadOnPasses
              exit:                 options.exit
              headed:               options.headed
              outputPath:           options.outputPath
            })
          .finally(allDone)

        ## TODO: we may still want to capture
        ## stdout even when no specs were found
        if record
          { projectName } = config

          recordMode.createRunAndRecordSpecs({
            key
            specs
            browser
            captured
            projectId
            projectRoot
            projectName
            specPattern
            runAllSpecs
          })
        else
          runAllSpecs()

  run: (options) ->
    electronApp
    .ready()
    .then =>
      @ready(options)

}
