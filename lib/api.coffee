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
      headers: {
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
      body: options.stats
      timeout: 10000
      headers: {
        "x-ci-id":         options.ciId
        "x-project-token": options.key
        "x-project-name":  options.projectName
        "x-version":       pkg.version
        "x-platform":      os.platform()
        "x-provider":      provider.get()
      }
    })

  createRaygunException: (body, session, timeout = 3000) ->
    rp.post({
      url: Routes.exceptions()
      body: body
      json: true
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
      headers: {
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
      headers: {
        "x-session": session
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
        "x-type": type
        "x-session": session
        "x-platform": os.platform()
        "x-version": pkg.version
        "x-project-name": projectName
      }
    })

  sendUsage: (numRuns, exampleSpec, allSpecs, session) ->
    rp.post({
      url: Routes.usage()
      json: true
      headers: {
        "x-session": session
        "x-platform": os.platform()
        "x-version": pkg.version
        "x-runs": numRuns
        "x-example": exampleSpec
        "x-all": allSpecs
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

  _token: (method, session) ->
    rp({
      method: method
      url: Routes.token()
      json: true
      headers: {
        "x-session": session
      }
    })
    .promise()
    .get("api_token")

  getToken: (session) ->
    @_token("get", session)

  updateToken:  ->
    @_token("put", session)

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