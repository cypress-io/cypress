_        = require("lodash")
Promise  = require("bluebird")
winston  = require("winston")
pkg      = require("@packages/root")

api      = require("./api")
user     = require("./user")
Settings = require("./util/settings")
system   = require("./util/system")

## strip everything but the file name to remove any sensitive
## data in the path
pathRe = /'?((\/|\\|[a-z]:\\)[^\s']+)+'?/ig
fileNameRe = /[^\s'/]+\.\w+:?\d*$/i
stripPath = (text) ->
  (text or "").replace pathRe, (path) ->
    fileName = _.last(path.split("/")) or ""
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
    return Promise.resolve() if process.env["CYPRESS_ENV"] isnt "production"

    Promise.join(@getBody(err), @getAuthToken())
    .spread (body, authToken) ->
      api.createRaygunException(body, authToken)
}
