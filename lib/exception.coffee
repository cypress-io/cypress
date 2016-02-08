request  = require("request-promise")
Promise  = require("bluebird")
winston  = require("winston")
fs       = require("fs-extra")
cache    = require("./cache")
api      = require("./api")
Log      = require("./log")
Settings = require("./util/settings")

## POST http://api.cypress.io/exceptions
## sets request body
## error: {}
## logs: {}
## cache: {}
## settings: {}
## version: {}

Exception = {
  getCache: ->
    cache.read()

  getLogs: ->
    Log.getLogs()

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

  getHeaders: ->
    cache.getUser().then (user) ->
      obj = {}
      obj["x-session"] = user.session_token if user.session_token
      obj

  create: (err, settings) ->
    return Promise.resolve() if process.env["CYPRESS_ENV"] isnt "production"

    ## should probably use Promise.props here
    Promise.all([@getBody(err, settings), @getHeaders()])
      .bind(@)
      .spread (body, headers) ->
        api.createRaygunException(body, headers)
        .promise()
        .timeout(3000)
}

module.exports = Exception