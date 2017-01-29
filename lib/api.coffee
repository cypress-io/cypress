_          = require("lodash")
os         = require("os")
getos      = require("getos")
request    = require("request-promise")
errors     = require("request-promise/errors")
Promise    = require("bluebird")
Routes     = require("./util/routes")
pkg        = require("../package.json")

getos = Promise.promisify(getos)

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

osVersion = (platform) ->
  Promise.try ->
    if platform is "linux"
      getos()
      .then (obj) ->
        [obj.dist, obj.release].join(" - ")
      .catch (err) ->
        os.release()
    else
      os.release()

module.exports = {
  ping: ->
    rp.get(Routes.ping())

  createBuild: (options = {}) ->
    rp.post({
      url: Routes.builds()
      json: true
      timeout: options.timeout ? 10000
      headers: {
        "x-route-version": "2"
      }
      body: _.pick(options, [
        "projectId"
        "projectToken"
        "commitSha"
        "commitBranch"
        "commitAuthorName"
        "commitAuthorEmail"
        "commitMessage"
        "remoteOrigin"
        "ciParams"
        "ciProvider"
        "ciBuildNumber"
      ])
    })
    .promise()
    .get("buildId")
    .catch(errors.StatusCodeError, formatResponseBody)

  createInstance: (options = {}) ->
    platform = os.platform()

    osVersion(platform)
    .then (v) ->
      rp.post({
        url: Routes.instances(options.buildId)
        json: true
        timeout: options.timeout ? 10000
        headers: {
          "x-route-version": "3"
        }
        body: {
          spec:           options.spec
          browserName:    "Electron"
          browserVersion: process.versions.chrome
          osName:         platform
          osVersion:      v
          osCpus:         os.cpus()
          osMemory:       {
            free:         os.freemem()
            total:        os.totalmem()
          }
        }
      })
      .promise()
      .get("instanceId")
      .catch(errors.StatusCodeError, formatResponseBody)

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

  createSignout: (authToken) ->
    rp.post({
      url: Routes.signout()
      json: true
      auth: {
        bearer: authToken
      }
    })
    .catch {statusCode: 401}, ->
      ## do nothing on 401

  createProject: (projectName, remoteOrigin, authToken) ->
    rp.post({
      url: Routes.projects()
      json: true
      auth: {
        bearer: authToken
      }
      body: {
        "x-project-name": projectName
        "x-remote-origin": remoteOrigin
      }
    })
    .promise()
    .get("uuid")

  updateProject: (projectId, type, projectName, authToken) ->
    ## TODO: change this to PUT method
    rp.get({
      url: Routes.project(projectId)
      json: true
      auth: {
        bearer: authToken
      }
      body: {
        "x-type": type
        "x-platform": os.platform()
        "x-version": pkg.version
        "x-project-name": projectName
      }
    })

  sendUsage: (numRuns, exampleSpec, allSpecs, projectName, authToken) ->
    rp.post({
      url: Routes.usage()
      json: true
      auth: {
        bearer: authToken
      }
      body: {
        "x-runs": numRuns
        "x-example": exampleSpec
        "x-all": allSpecs
        "x-project-name": projectName
      }
    })

  getLoginUrl: ->
    rp.get({
      url: Routes.auth(),
      json: true
    })
    .promise()
    .get("url")

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

  getProjectToken: (projectId, authToken) ->
    @_projectToken("get", projectId, authToken)

  updateProjectToken: (projectId, authToken) ->
    @_projectToken("put", projectId, authToken)

}
