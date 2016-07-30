_             = require("lodash")
fs            = require("fs-extra")
str           = require("underscore.string")
path          = require("path")
uuid          = require("node-uuid")
stream        = require("stream")
Promise       = require("bluebird")
socketIo      = require("@cypress/core-socket")
open          = require("./util/open")
buffers       = require("./util/buffers")
pathHelpers   = require("./util/path_helpers")
cwd           = require("./cwd")
exec          = require("./exec")
fixture       = require("./fixture")
Request       = require("./request")
errors        = require("./errors")
logger        = require("./logger")
launcher      = require("./launcher")
automation    = require("./automation")

existingState = null

runnerEvents = [
  "reporter:restart:test:run"
  "runnables:ready"
  "run:start"
  "test:before:hooks"
  "reporter:log:add"
  "reporter:log:state:changed"
  "paused"
  "test:after:hooks"
  "run:end"
]

reporterEvents = [
  # "go:to:file"
  "runner:restart"
  "runner:abort"
  "runner:console:log"
  "runner:console:error"
  "runner:show:snapshot"
  "runner:hide:snapshot"
  "reporter:restarted"
]

retry = (fn) ->
  Promise.delay(25).then(fn)

class Socket
  constructor: ->
    if not (@ instanceof Socket)
      return new Socket

  onTestFileChange: (integrationFolder, originalFilePath, filePath, stats) ->
    logger.info "onTestFileChange", filePath: filePath

    ## return if we're not a js or coffee file.
    ## this will weed out directories as well
    return if not /\.(js|coffee)$/.test filePath

    ## originalFilePath is what was originally sent to us when
    ## we were told to 'watch:test:file'
    ## and its what we want to send back to the client

    fs.statAsync(filePath)
    .then =>
      @io.emit "watched:file:changed", {file: originalFilePath}
    .catch(->)

  watchTestFileByPath: (config, originalFilePath, watchers, cb = ->) ->
    testFilePath = str.ltrim(originalFilePath, "/")

    ## normalize the testFilePath
    testFilePath = pathHelpers.getAbsolutePathToSpec(testFilePath, config)

    ## bail if we're already watching this
    ## exact file or we've turned off watching
    ## for file changes
    return cb() if (testFilePath is @testFilePath) or (config.watchForFileChanges is false)

    logger.info "watching test file", {path: testFilePath}

    ## remove the existing file by its path
    if @testFilePath
      watchers.remove(@testFilePath)

    ## store this location
    @testFilePath = testFilePath

    watchers.watchAsync(testFilePath, {
      onChange: _.bind(@onTestFileChange, @, config.integrationFolder, originalFilePath)
    })
    .then(cb)

  onRequest: (automation, options, cb) ->
    Request.send(automation, options)
    .then(cb)
    .catch (err) ->
      cb({__error: err.message})

  onRequestStream: (automation, options) ->
    Request.sendStream(automation, options)

  onFixture: (config, file, cb) ->
    fixture.get(config.fixturesFolder, file)
    .then(cb)
    .catch (err) ->
      cb({__error: err.message})

  onExec: (projectRoot, options, cb) ->
    exec.run(projectRoot, options)
    .then(cb)
    .catch (err) ->
      cb({__error: err.message, timedout: err.timedout})

  toReporter: (event, data) ->
    @io and @io.to("reporter").emit(event, data)

  toRunner: (event, data) ->
    @io and @io.to("runner").emit(event, data)

  onAutomation: (messages, message, data) ->
    Promise.try =>
      ## instead of throwing immediately here perhaps we need
      ## to make this more resilient by automatically retrying
      ## up to 1 second in the case where our automation room
      ## is empty. that would give padding for reconnections
      ## to automatically happen.
      ## for instance when socket.io detects a disconnect
      ## does it immediately remove the member from the room?
      ## YES it does per http://socket.io/docs/rooms-and-namespaces/#disconnection
      if _.isEmpty(@io.sockets.adapter.rooms.automation)
        throw new Error("Could not process '#{message}'. No automation servers connected.")
      else
        new Promise (resolve, reject) =>
          id = uuid.v4()
          messages[id] = (obj) ->
            ## normalize the error from automation responses
            if e = obj.__error
              err = new Error(e)
              err.name = obj.__name
              err.stack = obj.__stack
              reject(err)
            else
              ## normalize the response
              resolve(obj.response)

          @io.to("automation").emit("automation:request", id, message, data)

  createIo: (server, path, cookie) ->
    socketIo.server(server, {
      path: path
      destroyUpgrade: false
      serveClient: false
      cookie: cookie
    })

  _startListening: (server, watchers, config, options) ->
    _.defaults options,
      socketId: null
      onAutomationRequest: null
      onMocha: ->
      onConnect: ->
      onDomainSet: ->
      onFocusTests: ->
      onChromiumRun: ->
      onReloadBrowser: ->
      checkForAppErrors: ->

    messages = {}

    {integrationFolder, socketIoRoute, socketIoCookie} = config

    @testsDir = integrationFolder

    @io = @createIo(server, socketIoRoute, socketIoCookie)

    @io.on "connection", (socket) =>
      logger.info "socket connected"

      respond = (id, resp) ->
        if message = messages[id]
          delete messages[id]
          message(resp)

      automationRequest = (message, data) =>
        automate = options.onAutomationRequest ? (message, data) =>
          @onAutomation(messages, message, data)

        automation(config.namespace, socketIoCookie, config.screenshotsFolder)
        .request(message, data, automate)

      socket.on "automation:connected", =>
        return if socket.inAutomationRoom

        socket.inAutomationRoom = true
        socket.join("automation")

        ## if our automation disconnects then we're
        ## in trouble and should probably bomb everything
        socket.on "disconnect", =>
          ## if we are in headless mode then log out an error and maybe exit with process.exit(1)?
          Promise.delay(500)
          .then =>
            ## give ourselves about 500ms to reconnected
            ## and if we're connected its all good
            return if socket.connected

            ## TODO: if all of our clients have also disconnected
            ## then don't warn anything
            errors.warning("AUTOMATION_SERVER_DISCONNECTED")
            ## TODO: no longer emit this, just close the browser and display message in reporter
            @io.emit("automation:disconnected")

        socket.on "automation:push:request", (msg, data, cb = ->) =>
          fn = (data) =>
            @io.emit("automation:push:message", msg, data)
            cb()

          automation(config.namespace, socketIoCookie)
          .pushMessage(msg, data, fn)

        socket.on "automation:response", respond

      socket.on "automation:request", (message, data, cb) =>
        automationRequest(message, data)
        .then (resp) ->
          cb({response: resp})
        .catch (err) ->
          cb({__error: err.message, __name: err.name, __stack: err.stack})

      socket.on "reporter:connected", =>
        return if socket.inReporterRoom

        socket.inReporterRoom = true
        socket.join("reporter")

        ## TODO: what to do about reporter disconnections?

      socket.on "runner:connected", ->
        return if socket.inRunnerRoom

        socket.inRunnerRoom = true
        socket.join("runner")

        ## TODO: what to do about runner disconnections?

      socket.on "adapter:connected", =>
        logger.info "adapter:connected"

        socket.on "adapter:response", respond

      socket.on "adapter:request", (message, data, cb) =>
        ## if cb isnt a function then we know
        ## data is really the cb, so reassign it
        ## and set data to null
        if not _.isFunction(cb)
          cb = data
          data = null

        id = uuid.v4()

        logger.info "adapter:request", id: id, msg: message, data: data

        if _.keys(@io.sockets.adapter.rooms.adapter).length > 0
          messages[id] = cb
          @io.to("adapter").emit "adapter:request", id, message, data
        else
          cb({__error: "Could not process '#{message}'. No adapter servers connected."})

      socket.on "run:tests:in:chromium", (src) ->
        options.onChromiumRun(src)

      socket.on "watch:test:file", (filePath, cb) =>
        @watchTestFileByPath(config, filePath, watchers, cb)

      socket.on "request", (options, cb) =>
        @onRequest(automationRequest, options, cb)

      socket.on "fixture", (fixturePath, cb) =>
        @onFixture(config, fixturePath, cb)

      socket.on "exec", (options, cb) =>
        @onExec(config.projectRoot, options, cb)

      socket.on "app:connect", (socketId) ->
        options.onConnect(socketId, socket)

      socket.on "mocha", =>
        options.onMocha.apply(options, arguments)

      socket.on "open:finder", (p, cb = ->) ->
        open.opn(p)
        .then -> cb()

      socket.on "reload:browser", (url, browser) ->
        options.onReloadBrowser(url, browser)

      socket.on "focus:tests", ->
        options.onFocusTests()

      socket.on "is:automation:connected", (data = {}, cb) =>
        isConnected = =>
          automationRequest("is:automation:connected", data)

        tryConnected = =>
          Promise
          .try(isConnected)
          .catch ->
            retry(tryConnected)

        ## retry for up to data.timeout
        ## or 1 second
        Promise
        .try(tryConnected)
        .timeout(data.timeout ? 1000)
        .then ->
          cb(true)
        .catch Promise.TimeoutError, (err) ->
          cb(false)

      socket.on "set:domain", (url, cb) ->
        cb(options.onDomainSet(url))

      socket.on "resolve:domain", (url, cb) =>
        ## if we have a buffer for this url
        ## then just respond with its details
        ## so we are idempotant and do not make
        ## another request
        if obj = buffers.getByOriginalUrl(url)
          ## reset the cookies from the existing stream's jar
          Request.setJarCookies(obj.jar, automationRequest)
          .then (c) ->
            cb(obj.details)
        else
          redirects = []

          error = (err) ->
            cb({__error: err.message})

          makeRequest = (url) =>
            handleReqStream = (str) ->
              pt = str
              .on("error", error)
              .on "response", (incomingRes) ->
                jar = str.getJar()

                Request.setJarCookies(jar, automationRequest)
                .then (c) ->
                  newUrl = _.last(redirects) ? url

                  details = {
                    ## TODO: get a status code message here?
                    ok: /^2/.test(incomingRes.statusCode)
                    url: newUrl
                    status: incomingRes.statusCode
                    redirects: redirects
                    cookies: c
                  }

                  buffers.set({
                    url: newUrl
                    jar: jar
                    stream: pt
                    details: details
                    originalUrl: url
                    response: incomingRes
                  })

                  cb(details)
                .catch(error)
              .pipe(stream.PassThrough())

            @onRequestStream(automationRequest, {
              ## turn off gzip since we need to eventually
              ## rewrite these contents
              gzip: false
              url: url
              followRedirect: (incomingRes) ->
                redirects.push(incomingRes.headers.location)

                return true
            })
            .then(handleReqStream)
            .catch(error)

          makeRequest(url)

        # @onRequest(automationRequest, {
        #   url: url
        #   resolveWithFullResponse: false
        #   followRedirect: (resp) ->
        #     console.log "follow redirect", resp.headers
        #     redirects.push(resp.headers["location"])

        #     return true
        # }, (resp) ->
        #   resp.url = _.last(redirects) ? url
        #   ## we should set the cookies on the browser here
        #   ## resp.headers["set-cookie"]
        #   resp.redirects = redirects
        #   cb(resp)
        # )

      socket.on "preserve:run:state", (state, cb) ->
        existingState = state

        cb()

      socket.on "get:existing:run:state", (cb) ->
        if (s = existingState)
          existingState = null
          cb(s)
        else
          cb()

      socket.on "go:to:file", (p) ->
        launcher.launch("chrome", "http://localhost:2020/__#" + p, {
          host: "http://localhost:2020"
        })

      reporterEvents.forEach (event) =>
        socket.on event, (data) =>
          @toRunner(event, data)

      runnerEvents.forEach (event) =>
        socket.on event, (data) =>
          @toReporter(event, data)

  end: ->
    ## TODO: we need an 'ack' from this end
    ## event from the other side
    @io and @io.emit("tests:finished")

  changeToUrl: (url) ->
    @toRunner("change:to:url", url)

  startListening: (server, watchers, config, options) ->
    if process.env["CYPRESS_ENV"] is "development"
      @listenToCssChanges(watchers)

    @_startListening(server, watchers, config, options)

  listenToCssChanges: (watchers) ->
    watchers.watch cwd("lib", "public", "css"), {
      ignored: (path, stats) =>
        return false if fs.statSync(path).isDirectory()

        not /\.css$/.test path
      onChange: (filePath, stats) =>
        filePath = path.basename(filePath)
        @io.emit "cypress:css:changed", file: filePath
    }

  close: ->
    @io?.close()

module.exports = Socket
