r       = require("request")
rp      = require("request-promise")
errors  = require("request-promise/errors")
Routes  = require("./util/routes")

module.exports = {
  ping: ->
    rp.get(Routes.ping())

  createCiGuid: (options = {}) ->
    rp.post({
      url: Routes.ci(options.projectId)
      json: true
      headers: {
        "x-project-token": options.key
        "x-git-branch":    options.branch
        "x-git-author":    options.author
        "x-git-message":   options.message
      }
    })
    .promise()
    .get("ci_guid")

  createRaygunException: (body, session, timeout = 3000) ->
    rp.post({
      url: Routes.exceptions()
      body: body
      json: true
      headers: {
        "X-Session": session
      }
    })
    .promise()
    .timeout(timeout)

  createKeyRange: (projectId, session) ->
    rp.post({
      url: Routes.projectKeys(projectId)
      headers: {
        "X-Session": session
      }
    })

  createSignin: (code) ->
    rp.post({
      url: Routes.signin({code: code})
      json: true
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
        "X-Session": session
      }
    })

  createProject: (session) ->
    rp.post({
      url: Routes.projects()
      json: true
      headers: {
        "X-Session": session
      }
    })
    .promise()
    .get("uuid")

  getBuilds: (projectId, session) ->
    r.get({
      url: Routes.projectCi(projectId)
      json: true
      headers: {
        "X-Session": session
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
        "X-Session": session
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
        "X-Session": session
      }
    })
    .promise()
    .get("api_token")

  getProjectToken: (projectId, session) ->
    @_projectToken("get", projectId, session)

  updateProjectToken: (projectId, session) ->
    @_projectToken("put", projectId, session)

}