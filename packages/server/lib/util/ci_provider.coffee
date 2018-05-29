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

buildNums = (provider) -> {
  appveyor:  process.env.APPVEYOR_BUILD_NUMBER
  circle:    process.env.CIRCLE_BUILD_NUM
  codeship:  process.env.CI_BUILD_NUMBER
  gitlab:    process.env.CI_BUILD_ID
  jenkins:   process.env.BUILD_NUMBER
  travis:    process.env.TRAVIS_BUILD_NUMBER
  semaphore: process.env.SEMAPHORE_BUILD_NUMBER
  drone:     process.env.DRONE_BUILD_NUMBER
}[provider]

groupIds = (provider) -> {
  # for CircleCI v2 use workflow id to group builds
  circle:   process.env.CIRCLE_WORKFLOW_ID
}[provider]

params = (provider) -> {
  appveyor: {
    accountName:  process.env.APPVEYOR_ACCOUNT_NAME
    projectSlug:  process.env.APPVEYOR_PROJECT_SLUG
    buildVersion: process.env.APPVEYOR_BUILD_VERSION
  }
  circle: {
    buildUrl: process.env.CIRCLE_BUILD_URL
  }
  codeship: {
    buildUrl: process.env.CI_BUILD_URL
  }
  gitlab: {
    buildId:    process.env.CI_BUILD_ID
    projectUrl: process.env.CI_PROJECT_URL
  }
  jenkins: {
    buildUrl: process.env.BUILD_URL
  }
  travis: {
    buildId:  process.env.TRAVIS_BUILD_ID
    repoSlug: process.env.TRAVIS_REPO_SLUG
  }
  semaphore: {
    repoSlug: process.env.SEMAPHORE_REPO_SLUG
  }
  drone: {
    buildUrl:  process.env.DRONE_BUILD_LINK
  }
}[provider]

# details = {
#   "appveyor": -> {
#     ciUrl: "https://ci.appveyor.com/project/#{process.env.APPVEYOR_ACCOUNT_NAME}/#{process.env.APPVEYOR_PROJECT_SLUG}/build/#{process.env.APPVEYOR_BUILD_VERSION}"
#     buildNum: process.env.APPVEYOR_BUILD_NUMBER
#   }
#   "bamboo": nullDetails
#   "buildkite": nullDetails
#   "circle": -> {
#     ciUrl: process.env.CIRCLE_BUILD_URL
#     buildNum: process.env.CIRCLE_BUILD_NUM
#   }
#   "codeship": -> {
#     ciUrl: process.env.CI_BUILD_URL
#     buildNum: process.env.CI_BUILD_NUMBER
#   }
#   "gitlab": -> {
#     ciUrl: "#{process.env.CI_PROJECT_URL}/builds/#{process.env.CI_BUILD_ID}"
#     buildNum: process.env.CI_BUILD_ID
#   }
#   "hudson": nullDetails
#   "jenkins": -> {
#     ciUrl: process.env.BUILD_URL
#     buildNum: process.env.BUILD_NUMBER
#   }
#   "shippable": nullDetails
#   "snap": nullDetails
#   "teamcity": nullDetails
#   "teamfoundation": nullDetails
#   "travis": -> {
#     ciUrl: "https://travis-ci.org/#{process.env.TRAVIS_REPO_SLUG}/builds/#{process.env.TRAVIS_BUILD_ID}"
#     buildNum: process.env.TRAVIS_BUILD_NUMBER
#   }
#   "wercker": nullDetails

#   "unknown": nullDetails
# }

getProviderName = ->
  ## return the key of the first provider
  ## which is truthy
  name = _.findKey providers, (value, key) ->
    switch
      when _.isString(value)
        process.env[value]
      when _.isFunction(value)
        value()

  name or "unknown"

module.exports = {
  name: ->
    getProviderName()

  params: ->
    params(getProviderName()) ? null

  buildNum: ->
    buildNums(getProviderName()) ? null

  groupId: ->
    groupIds(getProviderName()) ? null
}
