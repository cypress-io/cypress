fs          = require 'fs'
_           = require 'underscore'
path        = require 'path'
uuid        = require 'node-uuid'
sauce       = require '../sauce/sauce.coffee'
jQuery      = require 'jquery-deferred'
chokidar    = require 'chokidar'
idGenerator = require '../id_generator.coffee'

module.exports = (io, app, config) ->
  io.on "connection", (socket) ->
    console.log "socket connected"

    socket.on "generate:test:id", (data, fn) ->
      console.log("generate:test:id", data)
      idGenerator.getId(data)
      .then(fn)
      .catch (err) ->
        console.log "\u0007", err.details, err.message
        fn(message: err.message)

    socket.on "finished:generating:ids:for:test", (strippedPath) ->
      console.log "finished:generating:ids:for:test", strippedPath
      io.emit "test:changed", file: strippedPath

    _.each "load:iframe command:add runner:start runner:end before:run before:add after:add suite:add suite:start suite:stop test test:add test:start test:end after:run test:results:ready exclusive:test".split(" "), (event) ->
      socket.on event, (args...) ->
        args = _.chain(args).compact().reject(_.isFunction).value()
        io.emit event, args...

    ## when we're told to run:sauce we receive
    ## the spec and callback with the name of our
    ## sauce labs job
    ## we'll embed some additional meta data into
    ## the job name
    socket.on "run:sauce", (spec, fn) ->
      ## this will be used to group jobs
      ## together for the runs related to 1
      ## spec by setting custom-data on the job object
      batchId = Date.now()

      jobName = app.get("eclectus").testFolder + "/" + spec
      fn(jobName, batchId)

      ## need to handle platform/browser/version incompatible configurations
      ## and throw our own error
      ## https://saucelabs.com/platforms/webdriver
      jobs = [
        { platform: "Windows 8.1", browser: "internet explorer",  version: 11 }
        { platform: "Windows 7",   browser: "internet explorer",  version: 10 }
        { platform: "Linux",       browser: "chrome",             version: 37 }
        { platform: "Linux",       browser: "firefox",            version: 33 }
        { platform: "OS X 10.9",   browser: "safari",             version: 7 }
      ]

      normalizeJobObject = (obj) ->
        obj = _(obj).clone()

        obj.browser = {
          "internet explorer": "ie"
        }[obj.browserName] or obj.browserName

        obj.os = obj.platform

        _(obj).pick "name", "browser", "version", "os", "batchId", "guid"

      _.each jobs, (job) ->
        options =
          host:        "0.0.0.0"
          port:        app.get("port")
          name:        jobName
          batchId:     batchId
          guid:        uuid.v4()
          browserName: job.browser
          version:     job.version
          platform:    job.platform

        clientObj = normalizeJobObject(options)
        socket.emit "sauce:job:create", clientObj

        df = jQuery.Deferred()

        df.progress (sessionID) ->
          ## pass up the sessionID to the previous client obj by its guid
          socket.emit "sauce:job:start", clientObj.guid, sessionID

        df.fail (err) ->
          socket.emit "sauce:job:fail", clientObj.guid, err

        df.done (sessionID, runningTime, passed) ->
          socket.emit "sauce:job:done", sessionID, runningTime, passed

        sauce options, df

  watchTestFiles = chokidar.watch path.join(config.projectRoot, app.get('eclectus').testFolder), ignored: (path, stats) ->
    ## this fn gets called twice, once with the directory
    ## which does not have a stats argument
    ## we always return false to include directories
    ## until we implement ignoring specific directories
    return false if fs.statSync(path).isDirectory()

    ## else if this is a file make sure its ignored if its not
    ## a js or coffee files
    not /\.(js|coffee)$/.test path

  watchTestFiles.on "change", (filepath, stats) ->
    ## simple solution for preventing firing test:changed events
    ## when we are making modifications to our own files
    return if app.enabled("editFileMode")

    ## strip out our testFolder path from the filepath, and any leading forward slashes
    strippedPath  = filepath.replace(app.get('eclectus').testFolder, "").replace(/^\/+/, "")#split("/")

    console.log "changed", filepath, strippedPath
    io.emit "generate:ids:for:test", filepath, strippedPath

  watchCssFiles = chokidar.watch path.join(__dirname, "../", "public", "css"), ignored: (path, stats) ->
    return false if fs.statSync(path).isDirectory()

    not /\.css$/.test path

  # watchCssFiles.on "add", (path) -> console.log "added css:", path
  watchCssFiles.on "change", (filepath, stats) ->
    filepath = path.basename(filepath)
    io.emit "eclectus:css:changed", file: filepath
