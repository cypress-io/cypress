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

  unpack: (destinationPath) ->

  download: (manifest) ->
    fn = (err, destinationPath) =>
      debugger
      @unpack(destinationPath)

    @getClient().download(fn, manifest)

  run: ->
    @getClient().checkNewVersion (err, newVersionExists, manifest) =>
      @download(manifest) if not err and newVersionExists

module.exports = Updater