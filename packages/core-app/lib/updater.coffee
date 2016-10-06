_              = require("lodash")
fs             = require("fs-extra")
tar            = require("tar-fs")
path           = require("path")
glob           = require("glob")
trash          = require("trash")
chmodr         = require("chmodr")
semver         = require("semver")
request        = require("request")
Promise        = require("bluebird")
NwUpdater      = require("node-webkit-updater")
cwd            = require("./cwd")
konfig         = require("./konfig")
logger         = require("./logger")
argsUtil       = require("./util/args")

trash  = Promise.promisify(trash)
chmodr = Promise.promisify(chmodr)

NwUpdater.prototype.checkNewVersion = (cb) ->
  gotManifest = (err, req, data) ->
    if err
      return cb(err)

    if req.statusCode < 200 or req.statusCode > 299
      return cb(new Error(req.statusCode))

    try
      data = JSON.parse(data)
    catch e
      return cb(e)

    try
      ## semver may throw here on invalid version
      newVersion = semver.gt(data.version, @manifest.version)
    catch e
      newVersion = false

    cb(null, newVersion, data)

  request.get(@manifest.manifestUrl, gotManifest.bind(@))

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

  getArgs: ->
    c = @getClient()

    _.compact ["--app-path=" + c.getAppPath(), "--exec-path=" + c.getAppExec(), "--updating"]

  patchAppPath: ->
    @getClient().getAppPath = -> cwd()

  getPackage: ->
    pkg = fs.readJsonSync cwd("package.json")
    pkg.manifestUrl = konfig("desktop_manifest_url")
    pkg

  getClient: ->
    ## requiring inline due to easier testability
    @client ? throw new Error("missing Updater#client")

  trash: (appPath) ->
    ## moves the current appPath to the trash
    ## this is the path to the existing app
    logger.info "trashing current app", appPath: appPath

    trash([appPath])

  install: (argsObj = {}) ->
    c = @getClient()

    {appPath, execPath} = argsObj

    ## slice out updating, execPath, and appPath args
    argsObj = _.omit(argsObj, "updating", "execPath", "appPath")

    args = argsUtil.toArray(argsObj)

    ## trash the 'old' app currently installed at the default
    ## installation: /Applications/Cypress.app
    @trash(appPath).then =>
      logger.info "installing updated app", appPath: appPath, execPath: execPath

      @copyTmpToAppPath(c.getAppPath(), appPath).then ->
        c.run(execPath, args)

        ## and now quit this process
        process.exit(0)

  copyTmpToAppPath: (tmp, appPath) ->
    new Promise (resolve, reject) ->

      obj = {
        fs: require("original-fs")
      }

      ## now move the /tmp application over
      ## to the 'existing / old' app path.
      ## meaning from from /tmp/Cypress.app to /Applications/Cypress.app

      ## https://github.com/atom/electron/pull/3641
      ## tar-fs
      tar
      .pack(tmp, obj)
      .pipe(tar.extract(appPath, obj))

      .on "error", reject

      .on "finish", resolve

  runInstaller: (newAppPath) ->
    ## get the --updating args
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

  @install = (options) ->
    Updater().install(options)

  @check = (options = {}) ->
    Updater().check(options)

  @run = (callbacks = {}) ->
    Updater(callbacks).run()

module.exports = Updater
