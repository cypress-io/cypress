Promise    = require("bluebird")
user       = require("./user")
errors     = require("./errors")
project    = require("./project")
Renderer   = require("./renderer")

module.exports = {
  getId: ->
    ## return a random id
    Math.random()

  openProject: (id, options) ->
    ## now open the project to boot the server
    ## putting our web client app in headless mode
    ## - NO  display server logs (via morgan)
    ## - YES display reporter results (via mocha reporter)
    project.open(options.projectPath, {
      morgan:       false
      socketId:     id
      reporter:     true
      isHeadless:   true
      port:         options.port
      # onError:
      environmentVariables: options.environmentVariables
    })

  createRenderer: (url) ->
    Renderer.create({
      url:    url
      width:  1280
      height: 720
      show:   false
      frame:  false
      type:   "PROJECT"
    })

  waitForSocketConnection: (project, id) ->
    new Promise (resolve, reject) ->
      fn = (socketId) ->
        if socketId is id
          ## remove the event listener if we've connected
          project.off "socket:connected", fn

          ## resolve the promise
          resolve()

      ## when a socket connects verify this
      ## is the one that matches our id!
      project.on "socket:connected", fn

  waitForRendererToConnect: (project, id) ->
    ## wait up to 10 seconds for the renderer
    ## to connect or die
    @waitForSocketConnection(project, id)
    .timeout(10000)
    .catch Promise.TimeoutError, (err) ->
      errors.throw("TESTS_DID_NOT_START")

  waitForTestsToFinishRunning: (project) ->
    new Promise (resolve, reject) ->
      ## when our project fires its end event
      ## resolve the promise
      project.once "end", resolve

  run: (app, options = {}) ->
    ## make sure we have a current session
    user.ensureSession()

    .then =>
      id = @getId()

      ## get our project instance (event emitter)
      @openProject(id, options)

      .then (project) =>
        config = project.getConfig()

        ## we know we're done running headlessly
        ## when the renderer has connected and
        ## finishes running all of the tests.
        ## we're using an event emitter interface
        ## to gracefully handle this in promise land
        Promise.join(
          @waitForRendererToConnect(project, id),
          @waitForTestsToFinishRunning(project),
          @createRenderer(config.allTestsUrl)
        )

    ## catch any errors and exit with them
    .catch(errors.exitWith)
}