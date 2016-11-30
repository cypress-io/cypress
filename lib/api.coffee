_        = require("lodash")
os       = require("os")
getos    = require("getos")
rp       = require("request-promise")
errors   = require("request-promise/errors")
Promise  = require("bluebird")
Routes   = require("./util/routes")
pkg      = require("../package.json")
provider = require("./util/provider")

getos = Promise.promisify(getos)

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

  getProjects: (session) ->
    rp.get({
      url: Routes.projects()
      json: true
      headers: {
        "x-route-version": "2"
        "x-session": session
      }
    })

  getProjectBuilds: (projectId, session) ->
    rp.get({
      url: Routes.projectBuilds(options.projectId)
      headers: {
        "x-route-version": "2"
        "x-session": session
      }
    })

  createBuild: (options = {}) ->
    rp.post({
      url: Routes.builds()
      json: true
      timeout: options.timeout ? 10000
      headers: {
        "x-route-version": "2"
      }
      body: {
        projectId:       options.projectId
        projectToken:    options.projectToken
        commitSha:       options.commitSha
        commitBranch:    options.commitBranch
        commitAuthor:    options.commitAuthor
        commitMessage:   options.commitMessage
        cypressVersion:  pkg.version
        ciProvider:      provider.get()
      }
    })
    .promise()
    .get("buildId")
    .catch(errors.StatusCodeError, formatResponseBody)

  createInstance: (options = {}) ->
    body = _.pick(options, [
      "tests"
      "duration"
      "passes"
      "failures"
      "pending"
      "video"
      "screenshots"
      "failingTests"
      "cypressConfig"
    ])

    platform = os.platform()

    osVersion(platform)
    .then (v) ->
      rp.post({
        url: Routes.instance(options.buildId)
        json: true
        timeout: options.timeout ? 10000
        headers: {
          "x-route-version": "2"
        }
        body: _.extend(body, {
          browserName:    "Electron"
          browserVersion: process.versions.chrome
          osName:         platform
          osVersion:      v
        })
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
    .catch (err) ->
      return if err.statusCode is 401

      throw err

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