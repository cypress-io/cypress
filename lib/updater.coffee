fs             = require("fs-extra")
path           = require("path")
Promise        = require("bluebird")
_              = require("lodash")
glob           = require("glob")
chmodr         = require("chmodr")
trash          = require("trash")
NwUpdater      = require("node-webkit-updater")
cwd            = require("./cwd")
config         = require("./config")
logger         = require("./logger")
argsUtil       = require("./util/args")

trash  = Promise.promisify(trash)
chmodr = Promise.promisify(chmodr)
coords = null

class Updater
  constructor: (callbacks) ->
    if not (@ instanceof Updater)
      return new Updater(callbacks)

    @client     = new NwUpdater @getPackage()
    @request    = null
    @cancelled  = false
    @callbacks  = callbacks

    if process.env["CYPRESS_ENV"] isnt "production"
      @patchAppPath()

  getCoords: ->
    return if not c = coords

    "--coords=#{c.x}x#{c.y}"

  getArgs: ->
    c = @getClient()

    _.compact ["--app-path=" + c.getAppPath(), "--exec-path=" + c.getAppExec(), "--updating", @getCoords()]

  patchAppPath: ->
    @getClient().getAppPath = -> cwd()

  getPackage: ->
    pkg = fs.readJsonSync cwd("package.json")
    pkg.manifestUrl = config.app.desktop_manifest_url
    pkg

  getClient: ->
    ## requiring inline due to easier testability
    @client ? throw new Error("missing Updater#client")

  trash: (appPath) ->
    ## moves the current appPath to the trash
    ## this is the path to the existing app
    logger.info "trashing current app", appPath: appPath

    trash([appPath])

  install: (appPath, execPath, argsObj = {}) ->
    c = @getClient()

    ## slice out updating, execPath, and appPath args
    argsObj = _.omit(argsObj, "updating", "execPath", "appPath")

    args = argsUtil.toArray(argsObj)

    ## trash the 'old' app currently installed at the default
    ## installation: /Applications/Cypress.app
    @trash(appPath).then =>
      logger.info "installing updated app", appPath: appPath, execPath: execPath

      ## now move the /tmp application over
      ## to the 'existing / old' app path.
      ## meaning from from /tmp/Cypress.app to /Applications/Cypress.app
      c.install appPath, (err) =>
        logger.info "running updated app", args: args

        c.run(execPath, args)

        ## and now quit this process
        process.exit(0)

  ## copies .cy to the new app path
  ## so we dont lose our cache, logs, etc
  copyCyDataTo: (newAppPath) ->
    p = new Promise (resolve, reject) ->
      glob "**/app.nw/package.json", {cwd: newAppPath}, (err, files) ->
        return reject(err) if err

        newAppConfigPath = path.join(newAppPath, path.dirname(files[0]), config.app.cy_path)

        logger.info "copying .cy to tmp destination", destination: newAppConfigPath

        resolve(newAppConfigPath)

    p.then (newAppConfigPath) ->
      cyConfigPath  = cwd(config.app.cy_path)
      fs.copyAsync(cyConfigPath, newAppConfigPath).then ->

        ## change all the permissions recursively to 0755
        chmodr(newAppConfigPath, 0o755)

  runInstaller: (newAppPath) ->
    @copyCyDataTo(newAppPath).bind(@).then ->

      ## get the --updating args + --coords args
      args = @getArgs()

      logger.info "running installer from tmp", destination: newAppPath, args: args

      ## runs the 'new' app in the /tmp directory with
      ## appPath + execPath to the 'existing / old' app
      ## (which is where its normally installed in /Applications)
      ## it additionally passes the --updating flag
      @getClient().runInstaller(newAppPath, args, {})

      process.exit()

  unpack: (destinationPath, manifest) ->
    logger.info "unpacking new version", destination: destinationPath

    @trigger("apply")

    fn = (err, newAppPath) =>
      return @trigger("error", err) if err

      return if @cancelled

      @runInstaller(newAppPath)

    @getClient().unpack(destinationPath, fn, manifest)

  download: (manifest) ->
    logger.info "downloading new version", version: manifest.version

    @trigger("download", manifest.version)

    fn = (err, destinationPath) =>
      return @trigger("error", err) if err

      ## fixes issue with updater failing during unpack
      setTimeout =>
        return if @cancelled

        @unpack(destinationPath, manifest)
      , 1000

    @request = @getClient().download(fn, manifest)

  cancel: ->
    @cancelled = true

    try
      ## attempt to abort the request
      ## and slurp up any errors
      @request.abort()

  trigger: (event, args...) ->
    ## normalize event name
    event = "on" + event[0].toUpperCase() + event.slice(1)
    if cb = @callbacks and @callbacks[event]
      cb.apply(@, args)

  check: (options = {}) ->
    logger.info "checking for new version"

    @getClient().checkNewVersion (err, newVersionExists, manifest) =>
      return @trigger("error", err) if err

      if newVersionExists
        logger.info "new version exists", version: manifest.version
        options.onNewVersion?(manifest)
      else
        logger.info "new version does not exist"
        options.onNoNewVersion?()

  run: ->
    @trigger("start")

    @check
      onNewVersion: (manifest) =>
        @download(manifest)

      onNoNewVersion: =>
        @trigger("none")

    return @

  @setCoords = (c) ->
    coords = c

  @install = (appPath, execPath, options) ->
    Updater().install(appPath, execPath, options)

  @check = (options = {}) ->
    Updater().check(options)

  @run = (callbacks = {}) ->
    Updater(callbacks).run()

module.exports = Updater
