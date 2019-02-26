_              = require("lodash")
nmi            = require("node-machine-id")
debug          = require("debug")("cypress:server:updater")
semver         = require("semver")
request        = require("request")
NwUpdater      = require("node-webkit-updater")
pkg            = require("@packages/root")
cwd            = require("./cwd")
konfig         = require("./konfig")

## backup the original cwd
localCwd = cwd()

osxAppRe   = /\.app$/
linuxAppRe = /Cypress$/i

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

  sendReq = (id) =>
    request.get({
      url: @manifest.manifestUrl,
      headers: {
        "x-cypress-version": pkg.version
        "x-machine-id": id
      }
    }, gotManifest.bind(@))

  ## return hashed value because we dont care nor want
  ## to know anything about you or your machine
  nmi.machineId()
  .then(sendReq)
  .catch ->
    sendReq(null)

class Updater
  constructor: (callbacks) ->
    if not (@ instanceof Updater)
      return new Updater(callbacks)

    @client     = new NwUpdater @getPackage()
    @request    = null
    @callbacks  = callbacks

    if process.env["CYPRESS_ENV"] isnt "production"
      @patchAppPath()

  patchAppPath: ->
    @getClient().getAppPath = -> cwd()

  getPackage: ->
    _.extend({}, pkg, {manifestUrl: konfig("desktop_manifest_url")})

  getClient: ->
    ## requiring inline due to easier testability
    @client ? throw new Error("missing Updater#client")

  trigger: (event, args...) ->
    ## normalize event name
    event = "on" + event[0].toUpperCase() + event.slice(1)
    if cb = @callbacks and @callbacks[event]
      cb.apply(@, args)

  check: (options = {}) ->
    debug("checking for new version of Cypress. current version is", pkg.version)

    @getClient().checkNewVersion (err, newVersionExists, manifest) =>
      return @trigger("error", err) if err

      if manifest
        debug("latest version of Cypress is:", manifest.version)

      if newVersionExists
        debug("new version of Cypress exists:", manifest.version)
        options.onNewVersion?(manifest)
      else
        debug("new version of Cypress does not exist")
        options.onNoNewVersion?()

  @check = (options = {}) ->
    Updater().check(options)

module.exports = Updater
