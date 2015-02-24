request  = require("request-promise")
Cache    = require("./cache")
Settings = require("./util/settings")
Routes   = require("./util/routes")

## POST http://api.cypress.io/exceptions
## sets request body
## error: {}
## logs: {}
## cache: {}
## settings: {}
## version: {}
## session: {}

Exception = {
  getUrl: ->
    Routes.exceptions()

  getBody: ->

  getHeaders: ->

  create: (err) ->
    request({
      url: @getUrl()
      body: @getBody()
      headers: @getHeaders()
      json: true
    })
    .promise().timeout(3000)

}

module.exports = Exception