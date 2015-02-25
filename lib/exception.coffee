request  = require("request-promise")
Promise  = require("bluebird")
winston  = require("winston")
cache    = require("./cache")
Log      = require("./log")
Settings = require("./util/settings")
Routes   = require("./util/routes")

## POST http://api.cypress.io/exceptions
## sets request body
## error: {}
## logs: {}
## cache: {}
## settings: {}
## version: {}

Exception = {
  getUrl: ->
    Routes.exceptions()

  getCache: ->
    cache.read()

  getLogs: ->
    Log.getLogs()

  getSettings: ->
    Settings.read()

  getErr: (err) ->
    {
      name: err.name
      message: err.message
      stack: err.stack
      info: winston.exception.getAllInfo(err)
    }

  getBody: (err) ->
    body = {err: @getErr(err)}

    Promise.all([@getCache(), @getLogs(), @getSettings()])
      .spread (cache, logs, settings) ->
        body.cache    = cache
        body.logs     = logs
        body.settings = settings
        body.version  = settings?.version
      .return(body)

  getHeaders: ->
    cache.getUser().then (user) ->
      obj = {}
      obj["x-session"] = user.session_token if user.session_token
      obj

  create: (err) ->
    Promise.all([@getBody(err), @getHeaders()])
      .bind(@)
      .spread (body, headers) ->
        request.post({
          url: @getUrl()
          body: body
          headers: headers
          json: true
        })
        .promise().timeout(3000)
}

module.exports = Exception