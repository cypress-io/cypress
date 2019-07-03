_          = require("lodash")
os         = require("os")
nmi        = require("node-machine-id")
debug      = require("debug")("cypress:server:api")
request    = require("request-promise")
errors     = require("request-promise/errors")
Promise    = require("bluebird")
humanInterval = require("human-interval")
agent      = require("@packages/network").agent
pkg        = require("@packages/root")
routes     = require("./util/routes")
system     = require("./util/system")

## TODO: improve this, dont just use
## requests because its way too verbose
# if debug.enabled
#   request.debug = true

THIRTY_SECONDS = humanInterval("30 seconds")
SIXTY_SECONDS = humanInterval("60 seconds")
TWO_MINUTES = humanInterval("2 minutes")

DELAYS = [
  THIRTY_SECONDS
  SIXTY_SECONDS
  TWO_MINUTES
]

if intervals = process.env.API_RETRY_INTERVALS
  DELAYS = _
  .chain(intervals)
  .split(",")
  .map(_.toNumber)
  .value()

rp = request.defaults (params = {}, callback) ->
  _.defaults(params, {
    agent: agent
    proxy: null
    gzip: true
  })

  headers = params.headers ?= {}

  _.defaults(headers, {
    "x-os-name":         os.platform()
    "x-cypress-version": pkg.version
  })

  method = params.method.toLowerCase()

  # use %j argument to ensure deep nested properties are serialized
  debug(
    "request to url: %s with params: %j",
    "#{params.method} #{params.url}",
    _.pick(params, "body", "headers")
  )

  request[method](params, callback)
  .promise()
  .tap (resp) ->
    debug("response %o", resp)

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

## retry on timeouts, 5xx errors, or any error without a status code
isRetriableError = (err) ->
  (err instanceof Promise.TimeoutError) or
  (500 <= err.statusCode < 600) or
  not err.statusCode?

module.exports = {
  rp

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
      headers: {
        "x-route-version": "3"
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  createRun: (options = {}) ->
    body = _.pick(options, [
      "ci"
      "specs",
      "commit"
      "group",
      "platform",
      "parallel",
      "ciBuildId",
      "projectId",
      "recordKey",
      "specPattern",
    ])

    rp.post({
      body
      url: routes.runs()
      json: true
      timeout: options.timeout ? SIXTY_SECONDS
      headers: {
        "x-route-version": "4"
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  createInstance: (options = {}) ->
    { runId, timeout } = options

    body = _.pick(options, [
      "spec"
      "groupId"
      "machineId"
      "platform"
    ])

    rp.post({
      body
      url: routes.instances(runId)
      json: true
      timeout: timeout ? SIXTY_SECONDS
      headers: {
        "x-route-version": "5"
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  updateInstanceStdout: (options = {}) ->
    rp.put({
      url: routes.instanceStdout(options.instanceId)
      json: true
      timeout: options.timeout ? SIXTY_SECONDS
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
      timeout: options.timeout ? SIXTY_SECONDS
      headers: {
        "x-route-version": "2"
      }
      body: _.pick(options, [
        "stats"
        "tests"
        "error"
        "video"
        "hooks"
        "stdout"
        "screenshots"
        "cypressConfig"
        "reporterStats"
      ])
    })
    .catch(errors.StatusCodeError, formatResponseBody)
    .catch(tagError)

  createCrashReport: (body, authToken, timeout = 3000) ->
    rp.post({
      url: routes.exceptions()
      json: true
      body: body
      auth: {
        bearer: authToken
      }
    })
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
    .get("apiToken")
    .catch(tagError)

  getProjectToken: (projectId, authToken) ->
    @_projectToken("get", projectId, authToken)

  updateProjectToken: (projectId, authToken) ->
    @_projectToken("put", projectId, authToken)

  retryWithBackoff: (fn, options = {}) ->
    ## for e2e testing purposes
    if process.env.DISABLE_API_RETRIES
      debug("api retries disabled")
      return Promise.try(fn)

    do attempt = (retryIndex = 0) ->
      Promise
      .try(fn)
      .catch isRetriableError, (err) ->
        if retryIndex > DELAYS.length
          throw err

        delay = DELAYS[retryIndex]

        if options.onBeforeRetry
          options.onBeforeRetry({
            err
            delay
            retryIndex
            total: DELAYS.length
          })

        retryIndex++

        Promise
        .delay(delay)
        .then ->
          debug("retry ##{retryIndex} after #{delay}ms")
          attempt(retryIndex)

}
