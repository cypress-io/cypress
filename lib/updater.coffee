global.config ?= require("konfig")()
fs             = require("fs-extra")
path           = require("path")

class Updater
  constructor: (App) ->
    if not (@ instanceof Updater)
      return new Updater(App)

    if not App
      throw new Error("Instantiating lib/updater requires an App!")

    @App        = App
    @client     = null
    @callbacks  = {}

  getPackage: ->
    pkg = fs.readJsonSync path.join(process.cwd(), "package.json")
    pkg.manifestUrl = [config.app.s3.path, config.app.s3.bucket, config.app.s3.manifest].join("/")
    pkg

  getClient: ->
    ## requiring inline due to easier testability
    NwUpdater = require("node-webkit-updater")
    @client ?= new NwUpdater @getPackage()

  install: (newAppPath) ->
    debugger
    c = @getClient()
    console.log "updater installing!"
    console.log "newAppPath:", newAppPath
    console.log "getAppPath:", c.getAppPath()
    console.log "getAppExec:", c.getAppExec()

    c.runInstaller(newAppPath, [c.getAppPath(), c.getAppExec()], {})

    debugger
    @App.quit()

  unpack: (destinationPath, manifest) ->
    # debugger
    console.log "updater unpacking!"
    @trigger("apply")
    fn = (err, newAppPath) =>
      @install(newAppPath) if not err

    @getClient().unpack(destinationPath, fn, manifest)

  download: (manifest) ->
    # debugger
    @trigger("download")
    console.log "updater download!", manifest
    fn = (err, destinationPath) =>
      @unpack(destinationPath, manifest) if not err

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