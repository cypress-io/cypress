_          = require("lodash")
pkg        = require("@packages/root")
uuid       = require("uuid")
path       = require("path")
chalk      = require("chalk")
human      = require("human-interval")
debug      = require("debug")("cypress:server:run")
Promise    = require("bluebird")
logSymbols = require("log-symbols")
recordMode = require("./record")
video      = require("../video")
errors     = require("../errors")
Project    = require("../project")
Reporter   = require("../reporter")
browsers   = require("../browsers")
openProject = require("../open_project")
Windows    = require("../gui/windows")
fs         = require("../util/fs")
env        = require("../util/env")
trash      = require("../util/trash")
random     = require("../util/random")
system     = require("../util/system")
progress   = require("../util/progress_bar")
terminal   = require("../util/terminal")
specsUtil  = require("../util/specs")
humanTime  = require("../util/human_time")
electronApp = require("../util/electron_app")

color = (val, c) ->
  chalk[c](val)

gray = (val) ->
  color(val, "gray")

colorIf = (val, c) ->
  if val is 0
    val = "-"
    c = "gray"

  color(val, c)

getSymbol = (num) ->
  if num then logSymbols.error else logSymbols.success

formatBrowser = (browser, headed) ->
  isHeadless = browser.name is "electron" and not headed

  ## todo finish browser
  _.compact([
    browser.displayName,
    browser.majorVersion,
    isHeadless and gray("(headless)")
  ]).join(" ")

formatFooterSummary = (results) ->
  { totalFailed, runs } = results

  ## pass or fail color
  c = if totalFailed then "red" else "green"

  phrase = do ->
    ## if we have any specs failing...
    if not totalFailed
      return "All specs passed!"

    ## number of specs
    total = runs.length
    failingRuns = _.filter(runs, "stats.failures").length
    percent = Math.round(failingRuns / total * 100)

    "#{failingRuns} of #{total} failed (#{percent}%)"

  return [
    color(phrase, c),
    gray(humanTime.short(results.totalDuration)),
    colorIf(results.totalTests, "reset"),
    colorIf(results.totalPassed, "green"),
    colorIf(totalFailed, "red"),
    colorIf(results.totalPending, "cyan"),
    colorIf(results.totalSkipped, "blue"),
  ]

formatSpecSummary = (name, failures) ->
  [
    getSymbol(failures),
    color(name, "reset")
  ]
  .join(" ")

formatSpecPattern = (specPattern) ->
  if specPattern
    specPattern.join(", ")

formatSpecs = (specs) ->
  names = _.map(specs, "name")

  ## 25 found: (foo.spec.js, bar.spec.js, baz.spec.js)
  [
    "#{names.length} found "
    gray("("),
    gray(names.join(', ')),
    gray(")")
  ]
  .join("")

displayRunStarting = (options = {}) ->
  { specs, specPattern, browser, headed, runUrl } = options

  console.log("")

  terminal.divider("=")

  console.log("")

  terminal.header("Run Starting", {
    color: ["reset"]
  })

  console.log("")

  table = terminal.table({
    colWidths: [12, 88]
    type: "outsideBorder"
  })

  data = _
  .chain([
    [gray("Cypress:"), pkg.version]
    [gray("Browser:"), formatBrowser(browser, headed)]
    [gray("Specs:"), formatSpecs(specs)]
    [gray("Searched:"), formatSpecPattern(specPattern)]
    [gray("Run URL:"), runUrl]
  ])
  .filter(_.property(1))
  .value()

  table.push(data...)

  console.log(table.toString())

  console.log("")

displaySpecHeader = (name, curr, total) ->
  console.log("")

  table = terminal.table({
    colWidths: [80, 20]
    colAligns: ["left", "right"]
    type: "pageDivider"
    style: {
      "padding-left": 2
    }
  })

  table.push(["", ""])
  table.push([
    "Running: " + gray(name + "..."),
    gray("(#{curr} of #{total})")
  ])

  console.log(table.toString())

collectTestResults = (obj = {}) ->
  {
    name:        _.get(obj, 'spec.name')
    tests:       _.get(obj, 'stats.tests')
    passes:      _.get(obj, 'stats.passes')
    pending:     _.get(obj, 'stats.pending')
    failures:    _.get(obj, 'stats.failures')
    skipped:     _.get(obj, 'stats.skipped' )
    duration:    humanTime.long(_.get(obj, 'stats.wallClockDuration'))
    screenshots: obj.screenshots and obj.screenshots.length
    video:       Boolean(obj.video)
  }

renderSummaryTable = (runUrl, results) ->
  { runs } = results

  console.log("")

  terminal.divider("=")

  console.log("")

  terminal.header("Run Finished", {
    color: ["reset"]
  })

  if runs and runs.length
    head =      ["  Spec", "", "Tests", "Passing", "Failing", "Pending", "Skipped"]
    colAligns = ["left", "right", "right", "right", "right", "right", "right"]
    colWidths = [40, 10, 10, 10, 10, 10, 10]

    table1 = terminal.table({
      colAligns
      colWidths
      type: "noBorder"
      head: _.map(head, gray)
    })

    table2 = terminal.table({
      colAligns
      colWidths
      type: "border"
    })

    table3 = terminal.table({
      colAligns
      colWidths
      type: "noBorder"
      head: formatFooterSummary(results)
      style: {
        "padding-right": 2
      }
    })

    _.each runs, (run) ->
      { spec, stats } = run

      ms = humanTime.short(stats.wallClockDuration)

      table2.push([
        formatSpecSummary(spec.name, stats.failures)
        color(ms, "gray")
        colorIf(stats.tests, "reset")
        colorIf(stats.passes, "green"),
        colorIf(stats.failures, "red"),
        colorIf(stats.pending, "cyan"),
        colorIf(stats.skipped, "blue")
      ])

    console.log("")
    console.log("")
    console.log(terminal.renderTables(table1, table2, table3))
    console.log("")

    if runUrl
      console.log("")

      table4 = terminal.table({
        colWidths: [100]
        type: "pageDivider"
        style: {
          "padding-left": 2
        }
      })

      table4.push(["", ""])
      table4.push(["Recorded Run: " + gray(runUrl)])

      console.log(terminal.renderTables(table4))
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
      console.log("")
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

trashAssets = (config = {}) ->
  if config.trashAssetsBeforeHeadlessRuns isnt true
    return Promise.resolve()

  Promise.join(
    trash.folder(config.videosFolder)
    trash.folder(config.screenshotsFolder)
  )
  .catch (err) ->
    ## dont make trashing assets fail the build
    errors.warning("CANNOT_TRASH_ASSETS", err.stack)

module.exports = {
  collectTestResults

  getProjectId

  writeOutput

  openProjectCreate

  createRecording: (name) ->
    outputDir = path.dirname(name)

    fs
    .ensureDirAsync(outputDir)
    .then ->
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

  displayResults: (obj = {}) ->
    results = collectTestResults(obj)

    c = if results.failures then "red" else "green"

    console.log("")

    terminal.header("Results", {
      color: [c]
    })

    table = terminal.table({
      type: "outsideBorder"
    })

    data = _.map [
      ["Tests:", results.tests]
      ["Passing:", results.passes]
      ["Failing:", results.failures]
      ["Pending:", results.pending]
      ["Skipped:", results.skipped]
      ["Screenshots:", results.screenshots]
      ["Video:", results.video]
      ["Duration:", results.duration]
      ["Spec Ran:", results.name]
    ], (arr) ->
      [key, val] = arr

      [color(key, "gray"), color(val, c)]

    table.push(data...)

    console.log("")
    console.log(table.toString())
    console.log("")

  displayScreenshots: (screenshots = []) ->
    console.log("")

    terminal.header("Screenshots", {color: ["yellow"]})

    console.log("")

    format = (s) ->
      dimensions = gray("(#{s.width}x#{s.height})")

      "  - #{s.path} #{dimensions}"

    screenshots.forEach (screenshot) ->
      console.log(format(screenshot))

    console.log("")

  postProcessRecording: (end, name, cname, videoCompression, shouldUploadVideo) ->
    debug("ending the video recording %o", { name, videoCompression, shouldUploadVideo })

    ## once this ended promises resolves
    ## then begin processing the file
    end()
    .then ->
      ## dont process anything if videoCompress is off
      ## or we've been told not to upload the video
      return if videoCompression is false or shouldUploadVideo is false

      console.log("")

      terminal.header("Video", {
        color: ["cyan"]
      })

      console.log("")

      # bar = progress.create("Post Processing Video")
      console.log(
        gray("  - Started processing:  "),
        chalk.cyan("Compressing to #{videoCompression} CRF")
      )

      started  = new Date
      progress = Date.now()
      tenSecs = human("10 seconds")

      onProgress = (float) ->
        switch
          when float is 1
            finished = new Date - started
            duration = "(#{humanTime.long(finished)})"
            console.log(
              gray("  - Finished processing: "),
              chalk.cyan(name),
              gray(duration)
            )
            console.log("")

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
    { browserName, spec, write, headed, project, screenshots } = options

    headed = !!headed

    browserOpts = switch browserName
      when "electron"
        @getElectronProps(headed, project, write)
      else
        {}

    browserOpts.automationMiddleware = {
      onAfterResponse: (message, data, resp) =>
        if message is "take:screenshot" and resp
          screenshots.push @screenshotMetadata(data, resp)

        resp
    }

    browserOpts.projectRoot = options.projectRoot

    openProject.launch(browserName, spec.absolute, browserOpts)

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

      onEnd = (obj) ->
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

      obj.spec = spec

      finish = ->
        return obj

      @displayResults(obj)

      if screenshots and screenshots.length
        @displayScreenshots(screenshots)

      { tests, stats } = obj

      failingTests = _.filter(tests, { state: "failed" })

      hasFailingTests = _.get(stats, 'failures') > 0

      ## if we have a video recording
      if started and tests and tests.length
        ## always set the video timestamp on tests
        obj.tests = Reporter.setVideoTimestamp(started, tests)

      ## we should upload the video if we upload on passes (by default)
      ## or if we have any failures and have started the video
      suv = Boolean(videoUploadOnPasses is true or (started and hasFailingTests))

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

  screenshotMetadata: (data, resp) ->
    {
      screenshotId: random.id()
      name:      data.name ? null
      testId:    data.testId
      takenAt:   resp.takenAt
      path:      resp.path
      height:    resp.dimensions.height
      width:     resp.dimensions.width
    }

  runSpecs: (options = {}) ->
    { config, browser, sys, headed, outputPath, specs, specPattern, beforeSpecRun, afterSpecRun, runUrl } = options

    results = {
      startedTestsAt: null
      endedTestsAt: null
      totalDuration: null
      totalSuites: null,
      totalTests: null,
      totalFailed: null,
      totalPassed: null,
      totalPending: null,
      totalSkipped: null,
      runs: null,
      browserPath: browser.path,
      browserName: browser.name,
      browserVersion: browser.version,
      osName: sys.osName,
      osVersion: sys.osVersion,
      cypressVersion: pkg.version,
      config,
    }

    displayRunStarting({
      specs
      runUrl
      headed
      browser
      specPattern
    })

    runEachSpec = (spec, index, length) =>
      Promise
      .try ->
        if beforeSpecRun
          debug("before spec run %o", spec)

          beforeSpecRun(spec)
      .then =>
        displaySpecHeader(spec.name, index + 1, length)

        @runSpec(spec, options)
      .get("results")
      .tap (results) ->
        debug("spec results %o", results)

        if afterSpecRun
          debug("after spec run %o", spec)

          afterSpecRun(results, config)

    Promise
    .mapSeries(specs, runEachSpec)
    .then (runs = []) ->
      results.startedTestsAt = start = getRun(_.first(runs), "stats.wallClockStartedAt")
      results.endedTestsAt = end = getRun(_.last(runs), "stats.wallClockEndedAt")
      results.totalDuration = reduceRuns(runs, "stats.wallClockDuration")
      results.totalSuites = reduceRuns(runs, "stats.suites")
      results.totalTests = reduceRuns(runs, "stats.tests")
      results.totalPassed = reduceRuns(runs, "stats.passes")
      results.totalPending = reduceRuns(runs, "stats.pending")
      results.totalFailed = reduceRuns(runs, "stats.failures")
      results.totalSkipped = reduceRuns(runs, "stats.skipped")
      results.runs = runs

      debug("final results of all runs: %o", results)

      writeOutput(outputPath, results)
      .return(results)

  runSpec: (spec = {}, options = {}) ->
    { project, headed, browser, videoRecording, videosFolder } = options

    browserName = browser.name

    debug("about to run spec %o", {
      spec
      headed
      browserName
    })

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
      if browserCanBeRecorded(browserName)
        if not videosFolder
          throw new Error("Missing videoFolder for recording")

        name  = path.join(videosFolder, spec.name + ".mp4")
        cname = path.join(videosFolder, spec.name + "-compressed.mp4")

        recording = @createRecording(name)
      else
        console.log("")

        if browserName is "electron" and options.headed
          errors.warning("CANNOT_RECORD_VIDEO_HEADED")
        else
          errors.warning("CANNOT_RECORD_VIDEO_FOR_THIS_BROWSER", browserName)

    Promise.resolve(recording)
    .then (props = {}) =>
      ## extract the started + ended promises from recording
      {start, end, write} = props

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
            headed
            started
            project
            screenshots
            exit:                 options.exit
            videoCompression:     options.videoCompression
            videoUploadOnPasses:  options.videoUploadOnPasses
          }),

          connection: @waitForBrowserToConnect({
            spec
            write
            headed
            project
            screenshots
            browserName
            socketId:    options.socketId
            webSecurity: options.webSecurity
            projectRoot: options.projectRoot
          })
        })

  findSpecs: (config, specPattern) ->
    specsUtil.find(config, specPattern)
    .tap (specs = []) =>
      if debug.enabled
        names = _.map(specs, "name")
        debug(
          "found '%d' specs using spec pattern '%s': %o",
          names.length,
          specPattern,
          names
        )

  ready: (options = {}) ->
    debug("run mode ready with options %o", options)

    _.defaults(options, {
      browser: "electron"
    })

    socketId = random.id()

    { projectRoot, record, key } = options

    browserName = options.browser

    ## alias and coerce to null
    specPattern = options.spec ? null

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

      Promise.all([
        system.info(),
        browsers.ensureAndGetByName(browserName),
        @findSpecs(config, specPattern),
        trashAssets(config),
      ])
      .spread (sys = {}, browser = {}, specs = []) =>
        ## return only what is return to the specPattern
        if specPattern
          specPattern = specsUtil.getPatternRelativeToProjectRoot(specPattern, projectRoot)

        if not specs.length
          errors.throw('NO_SPECS_FOUND', config.integrationFolder, specPattern)

        runAllSpecs = (beforeSpecRun, afterSpecRun, runUrl) =>
          @runSpecs({
            beforeSpecRun
            afterSpecRun
            projectRoot
            specPattern
            socketId
            browser
            project
            runUrl
            config
            specs
            sys
            videosFolder:         config.videosFolder
            videoRecording:       config.videoRecording
            videoCompression:     config.videoCompression
            videoUploadOnPasses:  config.videoUploadOnPasses
            exit:                 options.exit
            headed:               options.headed
            outputPath:           options.outputPath
          })
          .tap(_.partial(renderSummaryTable, runUrl))

        if record
          { projectName } = config

          recordMode.createRunAndRecordSpecs({
            key
            sys
            specs
            browser
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
