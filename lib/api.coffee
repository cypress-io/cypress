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

  getOrgs: (session) ->
    rp.get({
      url: Routes.orgs()
      json: true
      headers: {
        "x-session": session
      }
    })

  getProjects: (session) ->
    rp.get({
      url: Routes.projects()
      json: true
      headers: {
        "x-session": session
      }
    })

  getProject: (projectId, session) ->
    rp.get({
      url: Routes.project(projectId)
      json: true
      headers: {
        "x-session": session
        "x-route-version": "2"
      }
    })

  getProjectBuilds: (projectId, session, options = {}) ->
    options.page ?= 1
    rp.get({
      url: Routes.projectBuilds(projectId)
      json: true
      timeout: options.timeout ? 10000
      headers: {
        "x-session": session
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)

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
        "ciBuildNum"
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
      headers: {
        "x-route-version": "2"
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
    })
    .catch (err) ->
      return if err.statusCode is 401

      throw err

  createProject: (projectDetails, remoteOrigin, session) ->
    rp.post({
      url: Routes.projects()
      json: true
      headers: {
        "x-session": session
        "x-route-version": "2"
      }
      body: {
        name: projectDetails.projectName
        orgId: projectDetails.orgId
        public: projectDetails.public
        origin: remoteOrigin
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)

  getProjectCiKeys: (projectId, session) ->
    rp.get({
      url: Routes.projectCiKeys(projectId)
      json: true
      headers: {
        "x-session": session
      }
    })

  requestAccess: (orgId, session) ->
    rp.post({
      url: Routes.membershipRequests(orgId)
      json: true
      headers: {
        "x-session": session
      }
    })
    .catch(errors.StatusCodeError, formatResponseBody)

  sendUsage: (numRuns, exampleSpec, allSpecs, projectName, session) ->
    rp.post({
      url: Routes.usage()
      json: true
      headers: {
        "x-session": session
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

  _projectToken: (method, projectId, session) ->
    rp({
      method: method
      url: Routes.projectToken(projectId)
      json: true
      headers: {
        "x-session": session
        "x-route-version": "2"
      }
    })
    .promise()
    .get("apiToken")

  getProjectToken: (projectId, session) ->
    @_projectToken("get", projectId, session)

  updateProjectToken: (projectId, session) ->
    @_projectToken("put", projectId, session)

}
