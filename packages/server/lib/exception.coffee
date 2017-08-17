Promise  = require("bluebird")
winston  = require("winston")
fs       = require("fs-extra")
api      = require("./api")
user     = require("./user")
cache    = require("./cache")
logger   = require("./logger")
Settings = require("./util/settings")
pkg      = require("@packages/root")

## borrowed from https://github.com/atom/metrics/blob/master/lib/metrics.coffee#L168
pathRE = /'?((\/|\\|[a-z]:\\)[^\s']+)+'?/ig
stripPath = (text) ->
  text.replace(pathRE, "<path>")

## POST https://api.cypress.io/exceptions
## sets request body
## error: {}
## logs: {}
## cache: {}
## settings: {}
## version: {}

module.exports = {
  getCache: ->
    cache.read()

  getLogs: ->
    logger.getLogs()

  getErr: (err) ->
    {
      name: stripPath(err.name)
      message: stripPath(err.message)
      stack: stripPath(err.stack)
    }

  getVersion: ->
    Promise.resolve(pkg.version)

  getBody: (err, settings) ->
    body = {err: @getErr(err)}

    Promise.all([@getCache(), @getLogs(), @getVersion()])
      .spread (cache, logs, version) ->
        body.cache    = cache
        body.logs     = logs
        body.settings = settings
        body.version  = version
      .return(body)

  getAuthToken: ->
    user.get().then (user) ->
      user and user.authToken

  create: (err, settings) ->
    return Promise.resolve() if process.env["CYPRESS_ENV"] isnt "production"

    Promise.props({
      body:      @getBody(err, settings)
      authToken: @getAuthToken()
    })
    .then (props) ->
      api.createRaygunException(props.body, props.authToken)
}
