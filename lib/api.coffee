_        = require("lodash")
os       = require("os")
r        = require("request")
rp       = require("request-promise")
errors   = require("request-promise/errors")
Routes   = require("./util/routes")
pkg      = require("../package.json")
provider = require("./util/provider")

module.exports = {
  ping: ->
    rp.get(Routes.ping())

  createCi: (options = {}) ->
    rp.post({
      url: Routes.ci(options.projectId)
      json: true
      body: {
        "x-project-token": options.key
        "x-project-name":  options.projectName
        "x-git-branch":    options.branch
        "x-git-author":    options.author
        "x-git-message":   options.message
        "x-version":       pkg.version
        "x-platform":      os.platform()
        "x-provider":      provider.get()
      }
    })
    .promise()
    .get("ci_guid")

  updateCi: (options = {}) ->
    rp.put({
      url: Routes.ci(options.projectId)
      json: true
      timeout: 10000
      body: _.extend({}, options.stats, {
        "x-ci-id":         options.ciId
        "x-project-token": options.key
        "x-project-name":  options.projectName
        "x-version":       pkg.version
        "x-platform":      os.platform()
        "x-provider":      provider.get()
      })
    })

  createRaygunException: (body, session, timeout = 3000) ->
    rp.post({
      url: Routes.exceptions()
      json: true
      body: body
      headers: {
        "x-session": session
      }
    })
    .promise()
    .timeout(timeout)

  createSignin: (code) ->
    rp.post({
      url: Routes.signin({code: code})
      json: true
      body: {
        "x-platform": os.platform()
        "x-version":  pkg.version
      }
    })
    .catch errors.StatusCodeError, (err) ->
      ## slice out the status code since RP automatically
      ## adds this before the message
      err.message = err.message.split(" - ").slice(1).join("")
      throw err

  createSignout: (session) ->
    rp.post({
      url: Routes.signout()
      json: true
      headers: {
        "x-session": session
      }
      body: {
        "x-platform": os.platform()
        "x-version":  pkg.version
      }
    })

  createProject: (projectName, session) ->
    rp.post({
      url: Routes.projects()
      json: true
      headers: {
        "x-session": session
      }
      body: {
        "x-platform": os.platform()
        "x-version": pkg.version
        "x-project-name": projectName
      }
    })
    .promise()
    .get("uuid")

  updateProject: (projectId, type, projectName, session) ->
    ## TODO: change this to PUT method
    rp.get({
      url: Routes.project(projectId)
      json: true
      headers: {
        "x-session": session
      }
      body: {
        "x-type": type
        "x-platform": os.platform()
        "x-version": pkg.version
        "x-project-name": projectName
      }
    })

  sendUsage: (numRuns, exampleSpec, allSpecs, projectName, session) ->
    rp.post({
      url: Routes.usage()
      json: true
      headers: {
        "x-session": session
      }
      body: {
        "x-platform": os.platform()
        "x-version": pkg.version
        "x-runs": numRuns
        "x-example": exampleSpec
        "x-all": allSpecs
        "x-project-name": projectName
      }
    })

  getBuilds: (projectId, session) ->
    r.get({
      url: Routes.projectCi(projectId)
      json: true
      headers: {
        ## TODO: add x-version here
        "x-session": session
      }
    })

  getLoginUrl: ->
    rp.get({
      url: Routes.auth(),
      json: true
    })
    .promise()
    .get("url")

  _projectToken: (method, projectId, session) ->
    rp({
      method: method
      url: Routes.projectToken(projectId)
      json: true
      headers: {
        "x-session": session
      }
    })
    .promise()
    .get("api_token")

  getProjectToken: (projectId, session) ->
    @_projectToken("get", projectId, session)

  updateProjectToken: (projectId, session) ->
    @_projectToken("put", projectId, session)

}