_        = require("lodash")
UrlParse = require("url-parse")
konfig   = require("../konfig")

api_url = konfig("api_url")

routes = {
  api:           ""
  auth:          "auth"
  ping:          "ping"
  token:         "token"
  signin:        "signin"
  signout:       "signout"
  usage:         "user/usage"
  builds:        "builds"
  instance:      "builds/:id/instances"
  tests:         "tests/:id"
  projects:      "projects"
  project:       "projects/:id"
  projectCi:     "projects/:id/ci"
  projectKeys:   "projects/:id/keys"
  projectToken:  "projects/:id/token"
  exceptions:    "exceptions"
}

parseArgs = (url, args = []) ->
  _.each args, (value) ->
    switch
      when _.isObject(value)
        url.set("query", _.extend(url.query, value))

      when _.isString(value)
        url.set("pathname", url.pathname.replace(":id", value))

  return url

Routes = _.reduce routes, (memo, value, key) ->
  memo[key] = (args...) ->
    url = new UrlParse(api_url, true).set("pathname", value)
    url = parseArgs(url, args) if args.length
    url.toString()
  memo
, {}

module.exports = Routes