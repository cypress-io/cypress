_       = require("lodash")
Uri     = require("jsuri")
konfig  = require("../konfig")

api_url = konfig("api_url")

routes = {
  api:           ""
  auth:          "v1/auth"
  ping:          "ping"
  token:         "token"
  signin:        "signin"
  signout:       "signout"
  ci:            "ci/:id"
  tests:         "tests/:id"
  projects:      "projects"
  project:       "projects/:id"
  projectCi:     "projects/:id/ci"
  projectKeys:   "projects/:id/keys"
  projectToken:  "projects/:id/token"
  exceptions:    "exceptions"
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