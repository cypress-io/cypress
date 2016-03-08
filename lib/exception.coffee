request  = require("request-promise")
Promise  = require("bluebird")
winston  = require("winston")
fs       = require("fs-extra")
api      = require("./api")
user     = require("./user")
cache    = require("./cache")
logger   = require("./logger")
Settings = require("./util/settings")

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
      name: err.name
      message: err.message
      stack: err.stack
      info: winston.exception.getAllInfo(err)
    }

  getVersion: ->
    fs.readJsonAsync("./package.json").get("version")

  getBody: (err, settings) ->
    body = {err: @getErr(err)}

    Promise.all([@getCache(), @getLogs(), @getVersion()])
      .spread (cache, logs, version) ->
        body.cache    = cache
        body.logs     = logs
        body.settings = settings
        body.version  = version
      .return(body)

  getSession: ->
    user.get().then (user) ->
      user and user.session_token

  create: (err, settings) ->
    return Promise.resolve() if process.env["CYPRESS_ENV"] isnt "production"

    Promise.props({
      body:    @getBody(err, settings)
      session: @getSession()
    })
    .then (props) ->
      api.createRaygunException(props.body, props.session)
}