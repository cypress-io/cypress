_        = require("lodash")
Promise  = require("bluebird")
pkg      = require("@packages/root")
path     = require("path")

api      = require("./api")
user     = require("./user")
Settings = require("./util/settings")
system   = require("./util/system")

## strip everything but the file name to remove any sensitive
## data in the path
pathRe = /'?((\/|\\+|[a-z]:\\)[^\s']+)+'?/ig
pathSepRe = /[\/\\]+/
fileNameRe = /[^\s'/]+\.\w+:?\d*$/i
stripPath = (text) ->
  (text or "").replace pathRe, (path) ->
    fileName = _.last(path.split(pathSepRe)) or ""
    "<stripped-path>#{fileName}"

## POST https://api.cypress.io/exceptions
## sets request body
## err: {}
## version: {}

module.exports = {
  getErr: (err) ->
    {
      name: stripPath(err.name)
      message: stripPath(err.message)
      stack: stripPath(err.stack)
    }

  getVersion: ->
    pkg.version

  getBody: (err) ->
    system.info()
    .then (systemInfo) =>
      _.extend({
        err: @getErr(err)
        version: @getVersion()
      }, systemInfo)

  getAuthToken: ->
    user.get().then (user) ->
      user and user.authToken

  create: (err) ->
    if process.env["CYPRESS_ENV"] isnt "production" or
       process.env["CYPRESS_CRASH_REPORTS"] is "0"
      return Promise.resolve()

    Promise.join(@getBody(err), @getAuthToken())
    .spread (body, authToken) ->
      api.createCrashReport(body, authToken)
}
