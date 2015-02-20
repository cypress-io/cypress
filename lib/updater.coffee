global.config ?= require("konfig")()
fs             = require("fs-extra")
path           = require("path")
Promise        = require("bluebird")
_              = require("lodash")

class Updater
  constructor: (App) ->
    if not (@ instanceof Updater)
      return new Updater(App)

    if not App
      throw new Error("Instantiating lib/updater requires an App!")

    @App        = App
    @client     = null
    @callbacks  = {}

    @patchAppPath()

  patchAppPath: ->
    if process.env["NODE_ENV"] isnt "production"
      @getClient().getAppPath = ->  process.cwd()

  getPackage: ->
    pkg = fs.readJsonSync path.join(process.cwd(), "package.json")
    pkg.manifestUrl = [config.app.s3.path, config.app.s3.bucket, config.app.s3.manifest].join("/")
    pkg

  getClient: ->
    ## requiring inline due to easier testability
    NwUpdater = require("node-webkit-updater")
    @client ?= new NwUpdater @getPackage()

  install: (appPath, execPath) ->
    c = @getClient()

    args = @App.argv ? []
    args = _.without(args, "--updating")

    c.install appPath, (err) =>
      c.run(execPath, args)

      @App.quit()

  runInstaller: (newAppPath) ->
    c = @getClient()

    args = [c.getAppPath(), c.getAppExec(), "--updating"].concat(@App.argv ? [])

    c.runInstaller(newAppPath, args, {})

    @App.quit()

  unpack: (destinationPath, manifest) ->
    @trigger("apply")

    fn = (err, newAppPath) =>
      return @trigger("error", err) if err

      @runInstaller(newAppPath)

    @getClient().unpack(destinationPath, fn, manifest)

  download: (manifest) ->
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

  run: (@callbacks = {}) ->
    @trigger("start")

    @getClient().checkNewVersion (err, newVersionExists, manifest) =>
      return @trigger("error", err) if err

      if newVersionExists
        @download(manifest)
      else
        @trigger("none")

module.exports = Updater