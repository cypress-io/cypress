_          = require("lodash")
R          = require("ramda")
os         = require("os")
nmi        = require("node-machine-id")
request    = require("request-promise")
errors     = require("request-promise/errors")
Promise    = require("bluebird")
pkg        = require("@packages/root")
browsers   = require('./browsers')
Routes     = require("./util/routes")
system     = require("./util/system")
debug      = require("debug")("cypress:server:api")
la         = require("lazy-ass")
check      = require("check-more-types")

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

machineId = ->
  nmi.machineId()
  .catch ->
    return null

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
    debugReturnedBuild = (info) ->
      debug("received API response with buildId %s", info.buildId)
      debug("and list of specs to run", info.specs)
      debug("entire response", info)

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
      "specPattern",
      "parallelId"
    ])

    debug("creating project run")
    debug("project '%s' group id '%s'", body.projectId, body.groupId)

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
    .tap(debugReturnedBuild)
    .get("buildId")
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  createInstance: (options = {}) ->
    debugInstanceCreate = (instance) ->
      debug("created new instance for spec", options.spec)
      debug("returned object")
      debug(instance)

    { buildId, spec, timeout } = options

    browsers.getByName(options.browser)
    .then (browser = {}) ->
      ## get the formatted browserName
      ## and version of the browser we're
      ## about to be running on
      { displayName, version } = browser

      system.info()
      .then (systemInfo) ->
        instanceOptions = {
          spec:           options.spec
          browserName:    displayName
          browserVersion: version
          machineId: options.machineId
        }
        allOptions = _.extend(instanceOptions, systemInfo)
        debug("creating instance with options", allOptions)

        # always have Bluebird promise
        Promise.resolve(
          rp.post({
            url: Routes.instances(options.buildId)
            json: true
            timeout: options.timeout ? 10000
            headers: {
              "x-route-version": "3"
            }
            body: allOptions
          })
          .promise()
        )
        .tap(debugInstanceCreate)
        .then(R.pick(["instanceId", "machineId"]))
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
        "ciProvider" ## TODO: don't send this (no reason to)
        "cypressConfig"
        "stdout"
      ])
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  grabNextSpecForBuild: (options = {}) ->
    la(check.unemptyString(options.parallelId), "missing parallelId", options)

    rp.put({
      url: Routes.grabNextSpecForBuild(options.buildId)
      json: true
      timeout: options.timeout ? 10000,
      body: {
        parallelId: options.parallelId
      }
    })
    .promise()
    .get("spec")
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
    machineId()
    .then (id) ->
      h = {
        "x-route-version": "3"
        "x-accept-terms": "true"
      }

      if id
        h["x-machine-id"] = id

      rp.post({
        url: Routes.signin({code: code})
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
