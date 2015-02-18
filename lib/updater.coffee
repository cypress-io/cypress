global.config ?= require("konfig")()
fs             = require("fs-extra")
path           = require("path")
NwUpdater      = require("node-webkit-updater")

class Updater
  constructor: (App) ->
    if not (@ instanceof Updater)
      return new Updater(App)

    if not App
      throw new Error("Instantiating lib/updater requires an App!")

    @App    = App
    @client = null

  getPackage: ->
    pkg = fs.readJsonSync path.join(process.cwd(), "package.json")
    pkg.manifestUrl = [config.app.s3.path, config.app.s3.bucket, config.app.s3.manifest].join("/")
    pkg

  getClient: ->
    @client ?= new NwUpdater @getPackage()

  install: (newAppPath) ->
    debugger
    console.log "updater installing!"
    console.log "newAppPath:", newAppPath
    console.log "getAppPath:", c.getAppPath()
    console.log "getAppExec:", c.getAppExec()

    c = @getClient()
    c.runInstaller(newAppPath, [c.getAppPath(), c.getAppExec()], {})

    @App.quit()

  unpack: (destinationPath, manifest) ->
    debugger
    console.log "updater unpacking!"
    fn = (err, newAppPath) =>
      @install(newAppPath) if not err

    @getClient().unpack(destinationPath, fn, manifest)

  download: (manifest) ->
    debugger
    console.log "updater download!", manifest
    fn = (err, destinationPath) =>
      @unpack(destinationPath, manifest) if not err

    @getClient().download(fn, manifest)

  run: ->
    @getClient().checkNewVersion (err, newVersionExists, manifest) =>
      debugger
      @download(manifest) if not err and newVersionExists

module.exports = Updater