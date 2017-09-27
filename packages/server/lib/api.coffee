_          = require("lodash")
os         = require("os")
request    = require("request-promise")
errors     = require("request-promise/errors")
Promise    = require("bluebird")
pkg        = require("@packages/root")
Routes     = require("./util/routes")
system     = require("./util/system")

rp = request.defaults (params = {}, callback) ->
  headers = params.headers ?= {}

  _.defaults(headers, {
    "x-platform":        os.platform()
    "x-cypress-version": pkg.version
  })

  method = params.method.toLowerCase()

  request[method](params, callback)

formatResponseBody = (err) ->
  ## if the body is JSON object
  if _.isObject(err.error)
    ## transform the error message to include the
    ## stringified body (represented as the 'error' property)
    body = JSON.stringify(err.error, null, 2)
    err.message = [err.statusCode, body].join("\n\n")

  throw err


tagError = (err) ->
  err.isApiError = true
  throw err

module.exports = {
  ping: ->
    rp.get(Routes.ping())
    .catch(tagError)

  getOrgs: (authToken) ->
    rp.get({
      url: Routes.orgs()
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch(tagError)

  getProjects: (authToken) ->
    rp.get({
      url: Routes.projects()
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch(tagError)

  getProject: (projectId, authToken) ->
    rp.get({
      url: Routes.project(projectId)
      json: true
      auth: {
        bearer: authToken
      }
      headers: {
        "x-route-version": "2"
      }
    })
    .catch(tagError)

  getProjectRuns: (projectId, authToken, options = {}) ->
    options.page ?= 1
    rp.get({
      url: Routes.projectRuns(projectId)
      json: true
      timeout: options.timeout ? 10000
      auth: {
        bearer: authToken
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  createRun: (options = {}) ->
    body = _.pick(options, [
      "projectId"
      "recordKey"
      "commitSha"
      "commitBranch"
      "commitAuthorName"
      "commitAuthorEmail"
      "commitMessage"
      "remoteOrigin"
      "ciParams"
      "ciProvider"
      "ciBuildNumber",
      "groupId"
    ])
    rp.post({
      url: Routes.runs()
      json: true
      timeout: options.timeout ? 10000
      headers: {
        "x-route-version": "2"
      }
      body: body
    })
    .promise()
    .get("buildId")
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  createInstance: (options = {}) ->
    system.info()
    .then (systemInfo) ->
      rp.post({
        url: Routes.instances(options.buildId)
        json: true
        timeout: options.timeout ? 10000
        headers: {
          "x-route-version": "3"
        }
        body: _.extend({
          spec:           options.spec
          browserName:    "Electron"
        }, systemInfo)
      })
      .promise()
      .get("instanceId")
      .catch(errors.StatusCodeError, formatResponseBody)
      .catch(tagError)

  updateInstanceStdout: (options = {}) ->
    rp.put({
      url: Routes.instanceStdout(options.instanceId)
      json: true
      timeout: options.timeout ? 10000
      body: {
        stdout: options.stdout
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  updateInstance: (options = {}) ->
    rp.put({
      url: Routes.instance(options.instanceId)
      json: true
      timeout: options.timeout ? 10000
      body: _.pick(options, [
        "tests"
        "duration"
        "passes"
        "failures"
        "pending"
        "error"
        "video"
        "screenshots"
        "failingTests"
        "ciProvider"
        "cypressConfig"
        "stdout"
      ])
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  createRaygunException: (body, authToken, timeout = 3000) ->
    rp.post({
      url: Routes.exceptions()
      json: true
      body: body
      auth: {
        bearer: authToken
      }
    })
    .promise()
    .timeout(timeout)
    .catch(tagError)

  createSignin: (code) ->
    rp.post({
      url: Routes.signin({code: code})
      json: true
      headers: {
        "x-route-version": "3"
      }
    })
    .catch errors.StatusCodeError, (err) ->
      ## reset message to error which is a pure body
      ## representation of what was sent back from
      ## the API
      err.message = err.error

      throw err
    .catch(tagError)

  createSignout: (authToken) ->
    rp.post({
      url: Routes.signout()
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch({statusCode: 401}, ->) ## do nothing on 401
    .catch(tagError)

  createProject: (projectDetails, remoteOrigin, authToken) ->
    rp.post({
      url: Routes.projects()
      json: true
      auth: {
        bearer: authToken
      }
      headers: {
        "x-route-version": "2"
      }
      body: {
        name: projectDetails.projectName
        orgId: projectDetails.orgId
        public: projectDetails.public
        remoteOrigin: remoteOrigin
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  getProjectRecordKeys: (projectId, authToken) ->
    rp.get({
      url: Routes.projectRecordKeys(projectId)
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch(tagError)

  requestAccess: (projectId, authToken) ->
    rp.post({
      url: Routes.membershipRequests(projectId)
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  getLoginUrl: ->
    rp.get({
      url: Routes.auth(),
      json: true
    })
    .promise()
    .get("url")
    .catch(tagError)

  _projectToken: (method, projectId, authToken) ->
    rp({
      method: method
      url: Routes.projectToken(projectId)
      json: true
      auth: {
        bearer: authToken
      }
      headers: {
        "x-route-version": "2"
      }
    })
    .promise()
    .get("apiToken")
    .catch(tagError)

  getProjectToken: (projectId, authToken) ->
    @_projectToken("get", projectId, authToken)

  updateProjectToken: (projectId, authToken) ->
    @_projectToken("put", projectId, authToken)

}
