_          = require("lodash")
fs         = require("fs-extra")
path       = require("path")
chalk      = require("chalk")
Promise    = require("bluebird")
inquirer   = require("inquirer")
random     = require("randomstring")
user       = require("../user")
ffmpeg     = require("../ffmpeg")
errors     = require("../errors")
Project    = require("../project")
progress   = require("../progress_bar")
project    = require("../electron/handlers/project")
Renderer   = require("../electron/handlers/renderer")
automation = require("../electron/handlers/automation")

fs = Promise.promisifyAll(fs)

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

      ## else prompt to add the project
      ## and then open it!
      @promptAddProject(projectPath)
      .then(open)

  promptAddProject: (projectPath) ->
    console.log(
      chalk.yellow("We couldn't find a Cypress project at this path:"),
      chalk.blue(projectPath)
      "\n"
    )

    questions = [{
      name: "add"
      type: "list"
      message: "Would you like to add this project to Cypress?"
      choices: [{
        name: "Yes: add this project and run the tests."
        value: true
      },{
        name: "No:  don't add this project."
        value: false
      }]
    }]

    new Promise (resolve, reject) =>
      inquirer.prompt questions, (answers) =>
        if answers.add
          Project.add(projectPath)
          .then ->
            console.log chalk.green("\nOk great, added the project.\n")
            resolve()
          .catch(reject)
        else
          reject errors.get("PROJECT_DOES_NOT_EXIST")

  openProject: (id, options) ->
    # wantsExternalBrowser = true
    wantsExternalBrowser = !!options.browser

    ## now open the project to boot the server
    ## putting our web client app in headless mode
    ## - NO  display server logs (via morgan)
    ## - YES display reporter results (via mocha reporter)
    project.open(options.projectPath, options, {
      sync:         false
      morgan:       false
      socketId:     id
      report:       true
      isHeadless:   true
      ## TODO: get session into automation.perform
      onAutomationRequest: if wantsExternalBrowser then null else automation.perform

    })
    .catch {portInUse: true}, (err) ->
      errors.throw("PORT_IN_USE_LONG", err.port)

  createRecording: (name) ->
    outputDir = path.dirname(name)

    fs.ensureDirAsync(outputDir)
    .then ->
      console.log("\nStarted video recording: #{chalk.blue(name)}")

      ffmpeg.start(name)

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
      setFrameRate = _.once ->
        win.webContents.setFrameRate(20)

      ## should we even record?
      if write
        win.webContents.on "paint", (event, dirty, image) ->
          setFrameRate()

          write(image.toJPEG(100))

      win.webContents.on "new-window", (e, url, frameName, disposition, options) ->
        ## force new windows to automatically open with show: false
        ## this prevents window.open inside of javascript client code
        ## to cause a new BrowserWindow instance to open
        ## https://github.com/cypress-io/cypress/issues/123
        options.show = false

      win.center()

  postProcessRecording: (end, name, cname, videoCompression) ->
    divider = Array(100).join("=")

    console.log("\n" + divider + "\n")

    bar = progress.create("Post Processing Video")

    onProgress = (float) ->
      bar.tickTotal(float)

    ## once this ended promises resolves
    ## then begin processing the file
    end()
    .then ->
      ffmpeg.process(name, cname, videoCompression, onProgress)
    .catch (err) ->
      ## TODO: log that post processing failed but
      ## not letting this fail the actual run
      console.log err

  waitForRendererToConnect: (openProject, id) ->
    ## wait up to 10 seconds for the renderer
    ## to connect or die
    @waitForSocketConnection(openProject, id)
    .timeout(10000)
    .catch Promise.TimeoutError, (err) ->
      errors.throw("TESTS_DID_NOT_START")

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

  waitForTestsToFinishRunning: (openProject, gui, end, name, cname, videoCompression) ->
    new Promise (resolve, reject) =>
      ## dont ever end if we're in 'gui' debugging mode
      return if gui

      onEnd = (failures) =>
        console.log "onEnd called!", failures

        finish = ->
          resolve(failures)

        if end
          @postProcessRecording(end, name, cname, videoCompression)
          .then(finish)
          ## TODO: add a catch here
        else
          finish()

      ## when our openProject fires its end event
      ## resolve the promise
      openProject.once("end", onEnd)

  runTests: (options = {}) ->
    {openProject, id, url, proxyServer, gui, browser, webSecurity, videosFolder, videoRecording, videoCompression} = options

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

      getRenderer = =>
        ## if we have a browser then just physically launch it
        if browser
          project.launch(browser, url, null, {proxyServer: proxyServer})
        else
          @createRenderer(url, proxyServer, gui, webSecurity, write)

      ## make sure we start the recording first
      ## before doing anything
      Promise.resolve(start)
      .then =>
        Promise.props({
          connection: @waitForRendererToConnect(openProject, id)
          stats:      @waitForTestsToFinishRunning(openProject, gui, end, name, cname, videoCompression)
          renderer:   getRenderer()
        })

  ready: (options = {}) ->
    id = @getId()

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
        console.log("\nTests should begin momentarily...\n")

        @runTests({
          id:               id
          url:              url
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
