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
cache      = require("./cache")

THIRTY_SECONDS = humanInterval("30 seconds")
SIXTY_SECONDS = humanInterval("60 seconds")
TWO_MINUTES = humanInterval("2 minutes")


DELAYS = [
  THIRTY_SECONDS
  SIXTY_SECONDS
  TWO_MINUTES
]

responseCache = {}

if intervals = process.env.API_RETRY_INTERVALS
  DELAYS = _
  .chain(intervals)
  .split(",")
  .map(_.toNumber)
  .value()

rp = request.defaults (params = {}, callback) ->
  if params.cacheable and resp = getCachedResponse(params)
    debug("resolving with cached response for ", params.url)
    return Promise.resolve(resp)

  _.defaults(params, {
    agent: agent
    proxy: null
    gzip: true
    cacheable: false
  })

  headers = params.headers ?= {}

  _.defaults(headers, {
    "x-os-name":         os.platform()
    "x-cypress-version": pkg.version
  })

  method = params.method.toLowerCase()

  # use %j argument to ensure deep nested properties are serialized
  debug(
    "request to url: %s with params: %j and token: %s",
    "#{params.method} #{params.url}",
    _.pick(params, "body", "headers"),
    params.auth && params.auth.bearer
  )

  waitForTokenIfRefreshing(params)
  .then (authToken) ->
    if authToken
      params.auth.bearer = authToken

    request[method](params, callback)
    .promise()
    .tap (resp) ->
      if params.cacheable
        debug("caching response for ", params.url)
        cacheResponse(resp, params)

      debug("response %o", resp)
    .catch { statusCode: 401 }, (err) ->
      if not params.auth.bearer
        debug("received 401 but request was not sent with token, not retrying")
        throw err

      if params.retryingAfterRefresh
        debug("received second 401 error, not retrying")
        throw err

      debug("received 401 status code from api for %s, refreshing token once and retrying: ", params.url, err.message)

      refreshTokenOrWait()
      .then (authToken) ->
        debug("new token received", authToken)
        # retry request with new token
        params.method = method
        params.auth.bearer = authToken
        params.retryingAfterRefresh = true
        rp(params)

cacheResponse = (resp, params) ->
  responseCache[params.url] = resp

getCachedResponse = (params) ->
  responseCache[params.url]

refreshingTokenPromise = null

waitForTokenIfRefreshing = (params) ->
  ## if a token refresh is in process and this request requires auth, wait for it to complete before continuing
  if refreshingTokenPromise and params.auth
    return refreshingTokenPromise

  Promise.resolve()

refreshTokenOrWait = () ->
  ## ensure that we only have one refresh request in-flight at once
  ## directly using cache here because including `user` would cause a circular dependency
  ## TODO: refactor
  if not refreshingTokenPromise
    refreshingTokenPromise = cache.getUser()
    .then (user) ->
      getTokenFromRefresh(user.refreshToken)
      .then (tokens) ->
        user.authToken = tokens.id_token
        user.refreshToken = tokens.refresh_token
        cache.setUser(user)
        user.authToken
    .finally ->
      refreshingTokenPromise = null

  refreshingTokenPromise

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

getAuthUrls = ->
  rp.get({
    url: routes.auth(),
    json: true
    cacheable: true
    headers: {
      "x-route-version": "2"
    }
  })
  .catch(tagError)

getTokenFromRefresh = (refreshToken) ->
  getAuthUrls()
  .get('refreshEndpointUrl')
  .then (refreshEndpointUrl) ->
    rp.post({
      url: refreshEndpointUrl
      json: true
      body: {
        refresh_token: refreshToken
      }
    })
  .catch(tagError)

module.exports = {
  rp

  ping: ->
    rp.get(routes.ping())
    .catch(tagError)

  getMe: (authToken) ->
    rp.get({
      url: routes.me()
      json: true
      auth: {
        bearer: authToken
      }
    })

  getTokenFromCode: (code, redirectUri) ->
    getAuthUrls()
    .get('tokenEndpointUrl')
    .then (tokenEndpointUrl) ->
      rp.post({
        url: tokenEndpointUrl
        json: true
        body: {
          code
          redirect_uri: redirectUri
        }
      })
    .catch(tagError)

  getTokenFromRefresh

  getAuthUrls

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

  createRaygunException: (body, authToken, timeout = 3000) ->
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
