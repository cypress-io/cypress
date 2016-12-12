_          = require("lodash")
fs         = require("fs-extra")
uuid       = require("uuid")
path       = require("path")
chalk      = require("chalk")
human      = require("human-interval")
Promise    = require("bluebird")
inquirer   = require("inquirer")
random     = require("randomstring")
ss         = require("../screenshots")
user       = require("../user")
stats      = require("../stats")
video      = require("../video")
errors     = require("../errors")
Project    = require("../project")
Reporter   = require("../reporter")
progress   = require("../util/progress_bar")
trash      = require("../util/trash")
terminal   = require("../util/terminal")
humanTime  = require("../util/human_time")
project    = require("../electron/handlers/project")
Renderer   = require("../electron/handlers/renderer")
automation = require("../electron/handlers/automation")
pkg        = require("../../package.json")

fs = Promise.promisifyAll(fs)

TITLE_SEPARATOR = " /// "

module.exports = {
  getId: ->
    ## return a random id
    random.generate({
      length: 5
      capitalization: "lowercase"
    })

  setProxy: (proxyServer) ->
    session = require("electron").session

    new Promise (resolve) ->
      session.defaultSession.setProxy({
        proxyRules: proxyServer
      }, resolve)

  ensureAndOpenProjectByPath: (id, options) ->
    ## verify we have a project at this path
    ## and if not prompt the user to add this
    ## project. once added then open it.
    {projectPath} = options

    open = =>
      @openProject(id, options)

    Project.exists(projectPath)
    .then (bool) =>
      ## if we have this project then lets
      ## immediately open it!
      return open() if bool

      ## else tell the user we're adding this project
      console.log(
        "Added this project:"
        chalk.cyan(projectPath)
      )

      Project.add(projectPath)
      .then(open)

  openProject: (id, options) ->
    # wantsExternalBrowser = true
    # wantsExternalBrowser = !!options.browser

    ## now open the project to boot the server
    ## putting our web client app in headless mode
    ## - NO  display server logs (via morgan)
    ## - YES display reporter results (via mocha reporter)
    project.open(options.projectPath, options, {
      morgan:       false
      socketId:     id
      report:       true
      isHeadless:   options.isHeadless ? true
      onAutomationRequest: options.onAutomationRequest
      afterAutomationRequest: options.afterAutomationRequest
      ## TODO: get session into automation.perform
      # onAutomationRequest: if wantsExternalBrowser then null else automation.perform

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

  createRenderer: (url, proxyServer, showGui = false, chromeWebSecurity, write) ->
    @setProxy(proxyServer)
    .then ->
      Renderer.create({
        url:    url
        width:  1280
        height: 720
        show:   showGui
        frame:  showGui
        devTools: showGui
        chromeWebSecurity: chromeWebSecurity
        type:   "PROJECT"
      })
    .then (win) ->
      ## set framerate only once because if we
      ## set the framerate earlier it gets reset
      ## back to 60fps for some reason (bug?)
      setFrameRate = (num) ->
        if win.webContents.getFrameRate() isnt num
          win.webContents.setFrameRate(num)

      ## should we even record?
      if write
        win.webContents.on "paint", (event, dirty, image) ->
          setFrameRate(20)

          write(image.toJPEG(100))

      win.webContents.on "new-window", (e, url, frameName, disposition, options) ->
        ## force new windows to automatically open with show: false
        ## this prevents window.open inside of javascript client code
        ## to cause a new BrowserWindow instance to open
        ## https://github.com/cypress-io/cypress/issues/123
        options.show = false

      win.center()

  displayStats: (obj = {}) ->
    bgColor = if obj.failures then "bgRed" else "bgGreen"
    color   = if obj.failures then "red"   else "green"

    console.log("")

    terminal.header("Tests Finished", {
      color: [color]
    })

    console.log("")

    stats.display(color, {
      tests:       obj.tests
      passes:      obj.passes
      pending:     obj.pending
      failures:    obj.failures
      duration:    humanTime(obj.duration)
      screenshots: obj.screenshots and obj.screenshots.length
      video:       !!obj.video
      version:     pkg.version
    })

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

  postProcessRecording: (end, name, cname, videoCompression) ->
    ## once this ended promises resolves
    ## then begin processing the file
    end()
    .then ->
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
            console.log("  - Processing progress: ", chalk.cyan(percentage))

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

  closeAnyOpenBrowser: ->
    ## close either the open real browser
    ## or the electron renderer process
    Promise.join(
      Renderer.destroy("PROJECT")
      project.closeBrowser()
    )

  waitForRendererToConnect: (options = {}) ->
    { openProject, id, browser, url, proxyServer, gui, webSecurity, write, timeout } = options

    launchRenderer = =>
      ## if we have a browser then just physically launch it
      if browser
        project.launch(browser, url, null, {proxyServer: proxyServer})
      else
        @createRenderer(url, proxyServer, gui, webSecurity, write)

    attempts = 0

    do waitForRendererToConnect = =>
      Promise.join(
        @waitForSocketConnection(openProject, id)
        launchRenderer()
      )
      .timeout(timeout ? 10000)
      .catch Promise.TimeoutError, (err) =>
        attempts += 1

        console.log("")

        ## always first close the open browsers
        ## before retrying or dieing
        @closeAnyOpenBrowser()
        .then ->
          switch attempts
            ## try again up to 3 attempts
            when 1, 2
              word = if attempts is 1 then "Retrying..." else "Retrying again..."
              errors.warning("TESTS_DID_NOT_START_RETRYING", word)

              waitForRendererToConnect()

            else
              err = errors.get("TESTS_DID_NOT_START_FAILED")
              errors.log(err)

              openProject.emit("exitEarlyWithErr", err.message)

  waitForSocketConnection: (openProject, id) ->
    new Promise (resolve, reject) ->
      fn = (socketId) ->
        if socketId is id
          ## remove the event listener if we've connected
          openProject.removeListener "socket:connected", fn

          ## resolve the promise
          resolve()

      ## when a socket connects verify this
      ## is the one that matches our id!
      openProject.on "socket:connected", fn

  waitForTestsToFinishRunning: (options = {}) ->
    { openProject, gui, screenshots, started, end, name, cname, videoCompression } = options

    new Promise (resolve, reject) =>
      ## dont ever end if we're in 'gui' debugging mode
      return if gui

      onFinish = (obj) =>
        finish = ->
          openProject
          .getConfig()
          .then (cfg) ->
            obj.config = cfg
          .finally ->
            resolve(obj)

        if end
          obj.video = name

        if screenshots
          obj.screenshots = screenshots

        @displayStats(obj)

        if screenshots and screenshots.length
          @displayScreenshots(screenshots)

        ft = obj.failingTests

        if ft and ft.length
          obj.failingTests = Reporter.setVideoTimestamp(started, ft)

        if end
          @postProcessRecording(end, name, cname, videoCompression)
          .then(finish)
          ## TODO: add a catch here
        else
          finish()

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

        onFinish(obj)

      onEnd = (obj) =>
        onFinish(obj)

      ## when our openProject fires its end event
      ## resolve the promise
      openProject.once("end", onEnd)
      openProject.once("exitEarlyWithErr", onEarlyExit)

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
      ## dont attempt to copy if we're running in circle in test env
      if (ca = process.env.CIRCLE_ARTIFACTS) and process.env["CYPRESS_ENV"] isnt "test"
        Promise.join(
          ss.copy(screenshotsFolder, ca)
          video.copy(videosFolder, ca)
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

    ## we know we're done running headlessly
    ## when the renderer has connected and
    ## finishes running all of the tests.
    ## we're using an event emitter interface
    ## to gracefully handle this in promise land

    ## if we've been told to record and we're not spawning a headed browser
    if videoRecording and not browser
      id2       = @getId()
      name      = path.join(videosFolder, id2 + ".mp4")
      cname     = path.join(videosFolder, id2 + "-compressed.mp4")

      recording = @createRecording(name)

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
            gui:              options.gui
            openProject:      options.openProject
            screenshots:      options.screenshots
            videoCompression: options.videoCompression
            end
            name
            cname
            started
          })
          connection: @waitForRendererToConnect({
            id:          options.id
            gui:         options.gui
            url:         options.url
            proxyServer: options.proxyServer
            openProject: options.openProject
            webSecurity: options.webSecurity
            write
            browser
          })
        })

  ready: (options = {}) ->
    id = @getId()

    wantsExternalBrowser = !!options.browser

    screenshots = []

    options.onAutomationRequest    = if wantsExternalBrowser then null else automation.perform
    options.afterAutomationRequest = (msg, data, resp) =>
      if msg is "take:screenshot"
        screenshots.push @screenshotMetadata(data, resp)

      resp

    ## verify this is an added project
    ## and then open it, returning our
    ## project instance
    @ensureAndOpenProjectByPath(id, options)
    .then (openProject) =>
      Promise.all([
        openProject.getConfig(),

        ## either get the url to the all specs
        ## or if we've specificed one make sure
        ## it exists
        openProject.ensureSpecUrl(options.spec)
      ])
      .spread (config, url) =>
        @trashAssets(config)
        .then =>
          @runTests({
            id:               id
            url:              url
            screenshots:      screenshots
            openProject:      openProject
            proxyServer:      config.clientUrlDisplay
            webSecurity:      config.chromeWebSecurity
            videosFolder:     config.videosFolder
            videoRecording:   config.videoRecording
            videoCompression: config.videoCompression
            gui:              options.showHeadlessGui
            browser:          options.browser
          })
        .get("stats")
        .finally =>
          @copy(config.videosFolder, config.screenshotsFolder)
          .then =>
            if options.allDone isnt false
              @allDone()

  run: (options) ->
    app = require("electron").app

    waitForReady = ->
      new Promise (resolve, reject) ->
        app.on "ready", resolve

    Promise.any([
      waitForReady()
      Promise.delay(500)
    ])
    .then =>
      @ready(options)

}
