_        = require("lodash")
UrlParse = require("url-parse")
konfig   = require("../konfig")

api_url = konfig("api_url")

routes = {
  api:           ""
  auth:          "auth"
  ping:          "ping"
  signin:        "signin"
  signout:       "signout"
  orgs:          "organizations"
  runs:                   "builds"
  instances:              "builds/:id/instances"
  grabNextSpecForBuild:   "builds/:id/grab_next_spec"
  instance:               "instances/:id"
  instanceStdout:         "instances/:id/stdout"
  projects:           "projects"
  project:            "projects/:id"
  projectToken:       "projects/:id/token"
  projectRuns:        "projects/:id/builds"
  projectRecordKeys:  "projects/:id/keys"
  exceptions:         "exceptions"
  membershipRequests: "projects/:id/membership_requests"
}

parseArgs = (url, args = []) ->
  _.each args, (value) ->
    switch
      when _.isObject(value)
        url.set("query", _.extend(url.query, value))

      when _.isString(value) or _.isNumber(value)
        url.set("pathname", url.pathname.replace(":id", value))

  return url

Routes = _.reduce routes, (memo, value, key) ->
  memo[key] = (args...) ->
    url = new UrlParse(api_url, true)
    url.set("pathname", value) if value
    url = parseArgs(url, args) if args.length
    url.toString()
  memo
, {}

module.exports = Routes
