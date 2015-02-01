global.config ?= require("konfig")()
_              = require("lodash")
Uri            = require("jsuri")

api_url = config.app.api_url

routes = {
  api: ""
  signin: "signin"
}

addQueryParams = (url, params) ->
  _.reduce params, (memo, value, key) ->
    memo.addQueryParam(key, value)
    memo
  , url

Routes = _.reduce routes, (memo, value, key) ->
  memo[key] = (params) ->
    url = new Uri(api_url).setPath(value)
    url = addQueryParams(url, params) if params
    url.toString()
  memo
, {}

module.exports = Routes