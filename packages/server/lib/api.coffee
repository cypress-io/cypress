_          = require("lodash")
os         = require("os")
nmi        = require("node-machine-id")
request    = require("request-promise")
errors     = require("request-promise/errors")
Promise    = require("bluebird")
pkg        = require("@packages/root")
browsers   = require('./browsers')
routes     = require("./util/routes")
system     = require("./util/system")
debug      = require("debug")("cypress:server:api")

rp = request.defaults (params = {}, callback) ->
  _.defaults(params, {
    gzip: true
  })

  headers = params.headers ?= {}

  _.defaults(headers, {
    "x-platform":        os.platform()
    "x-cypress-version": pkg.version
  })

  method = params.method.toLowerCase()

  request[method](params, callback)

debugReturnedRun = (info) ->
  debug("received API response with id %s", info.id)
  debug("and list of specs to run", info.specs)

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

machineId = ->
  nmi.machineId()
  .catch ->
    return null

# resolves with platform object: browser name and version, os name
getPlatform = (browserName) ->
  browsers.getByName(browserName)
  .then (browser = {}) ->
    ## get the formatted browserName
    ## and version of the browser we're
    ## about to be running on
    { displayName, version } = browser

    {
      browserName: displayName
      browserVersion: version
      osName: os.platform()
    }

module.exports = {
  getPlatform: getPlatform

  ping: ->
    rp.get(routes.ping())
    .catch(tagError)

  getOrgs: (authToken) ->
    rp.get({
      url: routes.orgs()
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch(tagError)

  getProjects: (authToken) ->
    rp.get({
      url: routes.projects()
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch(tagError)

  getProject: (projectId, authToken) ->
    rp.get({
      url: routes.project(projectId)
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
      url: routes.projectRuns(projectId)
      json: true
      timeout: options.timeout ? 10000
      auth: {
        bearer: authToken
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  createRun: (options = {}) ->
    getPlatform(options.browser)
    .then (platform) ->

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
        "groupId",
        "specs",
        "specPattern"
      ])

      body.platform = platform

      debug("creating project run")
      debug("project '%s' group id '%s'", body.projectId, body.groupId)

      rp.post({
        url: routes.runs()
        json: true
        timeout: options.timeout ? 10000
        headers: {
          "x-route-version": "3"
        }
        body: body
      })
      .promise()
      .tap(debugReturnedRun)
      .get("runId")
      .catch(errors.StatusCodeError, formatResponseBody)
      .catch(tagError)

  createInstance: (options = {}) ->
    { runId, spec, timeout } = options

    getPlatform(options.browser)
    .then (platform) ->
      system.info()
      .then (systemInfo) ->
        systemInfo.spec = spec
        systemInfo.browserName = platform.browserName
        systemInfo.browserVersion = platform.browserVersion

        rp.post({
          url: routes.instances(runId)
          json: true
          timeout: timeout ? 10000
          headers: {
            "x-route-version": "4"
          }
          body: systemInfo
        })
        .promise()
        .get("instanceId")
        .catch(errors.StatusCodeError, formatResponseBody)
        .catch(tagError)

  updateInstanceStdout: (options = {}) ->
    rp.put({
      url: routes.instanceStdout(options.instanceId)
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
      url: routes.instance(options.instanceId)
      json: true
      timeout: options.timeout ? 10000
      headers: {
        "x-route-version": "2"
      }
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
        "ciProvider" ## TODO: don't send this (no reason to)
        "cypressConfig"
        "stdout"
      ])
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  createRaygunException: (body, authToken, timeout = 3000) ->
    rp.post({
      url: routes.exceptions()
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
    machineId()
    .then (id) ->
      h = {
        "x-route-version": "3"
        "x-accept-terms": "true"
      }

      if id
        h["x-machine-id"] = id

      rp.post({
        url: routes.signin({code: code})
        json: true
        headers: h
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
      url: routes.signout()
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch({statusCode: 401}, ->) ## do nothing on 401
    .catch(tagError)

  createProject: (projectDetails, remoteOrigin, authToken) ->
    rp.post({
      url: routes.projects()
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
      url: routes.projectRecordKeys(projectId)
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch(tagError)

  requestAccess: (projectId, authToken) ->
    rp.post({
      url: routes.membershipRequests(projectId)
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  getLoginUrl: ->
    rp.get({
      url: routes.auth(),
      json: true
    })
    .promise()
    .get("url")
    .catch(tagError)

  _projectToken: (method, projectId, authToken) ->
    rp({
      method: method
      url: routes.projectToken(projectId)
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
