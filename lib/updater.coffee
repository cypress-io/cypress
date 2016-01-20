fs             = require("fs-extra")
path           = require("path")
Promise        = require("bluebird")
_              = require("lodash")
glob           = require("glob")
chmodr         = require("chmodr")
trash          = require("trash")
config         = require("./config")
Log            = require("./log")

trash  = Promise.promisify(trash)
chmodr = Promise.promisify(chmodr)

class Updater
  constructor: ->
    if not (@ instanceof Updater)
      return new Updater

    @client     = null
    @coords     = null
    @callbacks  = {}

    @patchAppPath()

  setCoords: (@coords) ->

  getCoords: ->
    return if not c = @coords

    "--coords=#{c.x}x#{c.y}"

  getArgs: ->
    c = @getClient()

    _.compact [c.getAppPath(), c.getAppExec(), "--updating", @getCoords()]

  patchAppPath: ->
    if process.env["CYPRESS_ENV"] isnt "production"
      @getClient().getAppPath = -> process.cwd()

  getPackage: ->
    pkg = fs.readJsonSync path.join(process.cwd(), "package.json")
    pkg.manifestUrl = config.app.desktop_manifest_url
    pkg

  getClient: ->
    ## requiring inline due to easier testability
    NwUpdater = require("node-webkit-updater")
    @client ?= new NwUpdater @getPackage()

  trash: (appPath) ->
    ## moves the current appPath to the trash
    ## this is the path to the existing app
    Log.info "trashing current app", appPath: appPath

    trash([appPath])

  install: (appPath, execPath) ->
    c = @getClient()

    args = @App.argv ? []
    args = _.without(args, "--updating")

    @trash(appPath).then =>
      Log.info "installing updated app", appPath: appPath, execPath: execPath

      c.install appPath, (err) =>
        Log.info "running updated app", args: args

        c.run(execPath, args)

        @trigger("quit")

  ## copies .cy to the new app path
  ## so we dont lose our cache, logs, etc
  copyCyDataTo: (newAppPath) ->
    p = new Promise (resolve, reject) ->
      glob "**/app.nw/package.json", {cwd: newAppPath}, (err, files) ->
        return reject(err) if err

        newAppConfigPath = path.join(newAppPath, path.dirname(files[0]), config.app.cy_path)

        Log.info "copying .cy to tmp destination", destination: newAppConfigPath

        resolve(newAppConfigPath)

    p.then (newAppConfigPath) ->
      cyConfigPath  = path.join(process.cwd(), config.app.cy_path)
      fs.copyAsync(cyConfigPath, newAppConfigPath).then ->

        ## change all the permissions recursively to 0755
        chmodr(newAppConfigPath, 0o755)

  runInstaller: (newAppPath) ->
    @copyCyDataTo(newAppPath).bind(@).then ->

      args = @getArgs()

      Log.info "running installer from tmp", destination: newAppPath, args: args

      @getClient().runInstaller(newAppPath, args, {})

      @trigger("quit")

  unpack: (destinationPath, manifest) ->
    Log.info "unpacking new version", destination: destinationPath

    @trigger("apply")

    fn = (err, newAppPath) =>
      return @trigger("error", err) if err

      @runInstaller(newAppPath)

    @getClient().unpack(destinationPath, fn, manifest)

  download: (manifest) ->
    Log.info "downloading new version", version: manifest.version

    @trigger("download", manifest.version)

    fn = (err, destinationPath) =>
      return @trigger("error", err) if err

      ## fixes issue with updater failing during unpack
      setTimeout =>
        @unpack(destinationPath, manifest)
      , 1000

    @getClient().download(fn, manifest)

  trigger: (event, args...) ->
    ## normalize event name
    event = "on" + event[0].toUpperCase() + event.slice(1)
    if cb = @callbacks[event]
      cb.apply(@, args)

  check: (options = {}) ->
    Log.info "checking for new version"

    @getClient().checkNewVersion (err, newVersionExists, manifest) =>
      return @trigger("error", err) if err

      if newVersionExists
        Log.info "new version exists", version: manifest.version
        options.onNewVersion?(manifest)
      else
        Log.info "new version does not exist", version: manifest?.version
        options.onNoNewVersion?()

  run: (@callbacks = {}) ->
    @trigger("start")

    @check
      onNewVersion: (manifest) =>
        @download(manifest)

      onNoNewVersion: =>
        @trigger("none")

module.exports = Updater
