_ = require("lodash")

isCodeship = ->
  process.env.CI_NAME and process.env.CI_NAME is "codeship"

isGitlab = ->
  process.env.GITLAB_CI or process.env.CI_SERVER_NAME and process.env.CI_SERVER_NAME is "GitLab CI"

isWercker = ->
  process.env.WERCKER or process.env.WERCKER_MAIN_PIPELINE_STARTED

providers = {
  "appveyor":       "APPVEYOR"
  "bamboo":         "bamboo_planKey"
  "buildkite":      "BUILDKITE"
  "circle":         "CIRCLECI"
  "codeship":       isCodeship
  "drone":          "DRONE"
  "gitlab":         isGitlab
  "hudson":         "HUDSON_URL"
  "jenkins":        "JENKINS_URL"
  "semaphore":      "SEMAPHORE"
  "shippable":      "SHIPPABLE"
  "snap":           "SNAP_CI"
  "teamcity":       "TEAMCITY_VERSION"
  "teamfoundation": "TF_BUILD"
  "travis":          "TRAVIS"
  "wercker":         isWercker
}

getProviderKey = ->
  ## return the key of the first provider
  ## which is truthy
  _.findKey providers, (value, key) ->
    switch
      when _.isString(value)
        process.env[value]
      when _.isFunction(value)
        value()

module.exports = {
  get: ->
    getProviderKey() ? "unknown"
}