global.config ?= require("konfig")()
_              = require("lodash")
Uri            = require("jsuri")

api_url = config.app.api_url

routes = {
  api: ""
  token: "token"
  signin: "signin"
  signout: "signout"
  exceptions: "exceptions"
}

addQueryParams = (url, params) ->
  _.reduce params, (memo, value, key) ->
    memo.addQueryParam(key, value)
    memo
  , url

parseArgs = (url, args = []) ->
  _.each args, (value) ->
    switch
      when _.isObject(value)
        addQueryParams(url, value)

      when _.isString(value)
        url.setPath url.path().replace(":id", value)

  return url

Routes = _.reduce routes, (memo, value, key) ->
  memo[key] = (args...) ->
    url = new Uri(api_url).setPath(value)
    url = parseArgs(url, args) if args.length
    url.toString()
  memo
, {}

module.exports = Routes