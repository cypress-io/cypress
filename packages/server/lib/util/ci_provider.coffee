_ = require("lodash")
la = require("lazy-ass")
check = require("check-more-types")

isCodeship = ->
  process.env.CI_NAME and process.env.CI_NAME is "codeship"

isGitlab = ->
  process.env.GITLAB_CI or process.env.CI_SERVER_NAME and process.env.CI_SERVER_NAME is "GitLab CI"

isJenkins = ->
  process.env.JENKINS_URL or process.env.JENKINS_HOME or process.env.JENKINS_VERSION

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
  "jenkins":        isJenkins
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
  drone:     process.env.DRONE_BUILD_NUMBER
  gitlab:    process.env.CI_BUILD_ID
  jenkins:   process.env.BUILD_NUMBER
  semaphore: process.env.SEMAPHORE_BUILD_NUMBER
  travis:    process.env.TRAVIS_BUILD_NUMBER
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
  drone: {
    buildUrl:  process.env.DRONE_BUILD_LINK
  }
  gitlab: {
    buildId:    process.env.CI_BUILD_ID
    projectUrl: process.env.CI_PROJECT_URL
  }
  jenkins: {
    buildUrl: process.env.BUILD_URL
  }
  semaphore: {
    repoSlug: process.env.SEMAPHORE_REPO_SLUG
  }
  travis: {
    buildId:  process.env.TRAVIS_BUILD_ID
    repoSlug: process.env.TRAVIS_REPO_SLUG
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

# splits a string like "https://github.com/cypress-io/cypress/pull/2114"
# and returns last part (the PR number, but as a string)
pullRequestUrlToString = (url) ->
  la(check.url(url), "expected pull request url", url)
  _.last(url.split("/"))

# if pull request is from a forked repo, there is a number
# otherwise there is an url that we can get the last part from
# example
#   non-forked PR:
#     CIRCLE_PULL_REQUEST=https://github.com/cypress-io/cypress/pull/2114
#   forked PR:
#     CIRCLE_PR_NUMBER=2012
#     CIRCLE_PULL_REQUEST=https://github.com/cypress-io/cypress/pull/2012
getCirclePrNumber = (envPrNumber, envPrUrl) ->
  if envPrNumber
    return envPrNumber

  if envPrUrl
    return pullRequestUrlToString(envPrUrl)

getGitInfo = (provider, key) -> ({
  appveyor: {
    sha: process.env.APPVEYOR_REPO_COMMIT
    ## for PRs, APPVEYOR_REPO_BRANCH is the base branch being merged into
    branch: process.env.APPVEYOR_PULL_REQUEST_HEAD_REPO_BRANCH or process.env.APPVEYOR_REPO_BRANCH
    authorName: process.env.APPVEYOR_REPO_COMMIT_AUTHOR
    authorEmail: process.env.APPVEYOR_REPO_COMMIT_AUTHOR_EMAIL
    message: process.env.APPVEYOR_REPO_COMMIT_MESSAGE + (process.env.APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED ? "")
    # remoteOrigin:
    pullRequestId: process.env.APPVEYOR_PULL_REQUEST_NUMBER
    # defaultBranch:
  }
  bamboo: {
    ## ???
  }
  buildkite: {
    sha: process.env.BUILDKITE_COMMIT
    branch: process.env.BUILDKITE_BRANCH
    authorName: process.env.BUILDKITE_BUILD_CREATOR
    authorEmail: process.env.BUILDKITE_BUILD_CREATOR_EMAIL
    message: process.env.BUILDKITE_MESSAGE
    # remoteOrigin:
    pullRequestId: process.env.BUILDKITE_PULL_REQUEST
    defaultBranch: process.env.BUILDKITE_PIPELINE_DEFAULT_BRANCH
  }
  circle: {
    sha: process.env.CIRCLE_SHA1
    branch: process.env.CIRCLE_BRANCH
    authorName: process.env.CIRCLE_USERNAME
    # authorEmail:
    # message:
    # remoteOrigin:
    pullRequestId: getCirclePrNumber(process.env.CIRCLE_PR_NUMBER, process.env.CIRCLE_PULL_REQUEST)
    # defaultBranch:
  }
  codeship: {
    sha: process.env.CI_COMMIT_ID
    branch: process.env.CI_BRANCH
    authorName: process.env.CI_COMMITTER_NAME
    authorEmail: process.env.CI_COMMITTER_EMAIL
    message: process.env.CI_COMMIT_MESSAGE
    # remoteOrigin:
    # pullRequestId: ## https://community.codeship.com/t/populate-ci-pull-request/1053
    # defaultBranch:
  }
  drone: {
    sha: process.env.DRONE_COMMIT_SHA
    branch: process.env.DRONE_COMMIT_BRANCH
    authorName: process.env.DRONE_COMMIT_AUTHOR
    authorEmail: process.env.DRONE_COMMIT_AUTHOR_EMAIL
    message: process.env.DRONE_COMMIT_MESSAGE
    # remoteOrigin:
    pullRequestId: process.env.DRONE_PULL_REQUEST
    defaultBranch: process.env.DRONE_REPO_BRANCH
  }
  gitlab: {
    sha: process.env.CI_COMMIT_SHA
    branch: process.env.CI_COMMIT_REF_NAME
    authorName: process.env.GITLAB_USER_NAME
    authorEmail: process.env.GITLAB_USER_EMAIL
    message: process.env.CI_COMMIT_MESSAGE
    # remoteOrigin:
    # pullRequestId: ## https://gitlab.com/gitlab-org/gitlab-ce/issues/23902
    # defaultBranch:
  }
  hudson: {
    ## same as jenkins?
  }
  jenkins: {
    sha: process.env.GIT_COMMIT
    branch: process.env.GIT_BRANCH
    # authorName:
    # authorEmail:
    # message:
    # remoteOrigin:
    pullRequestId: process.env.ghprbPullId
    # defaultBranch:
  }
  semaphore: {
    # sha:
    # branch:
    # authorName:
    # authorEmail:
    # message:
    # remoteOrigin:
    ## Only from forks? https://semaphoreci.com/docs/available-environment-variables.html
    pullRequestId: process.env.PULL_REQUEST_NUMBER
    # defaultBranch
  }
  shippable: {
    sha: process.env.COMMIT
    branch: process.env.BRANCH
    authorName: process.env.COMMITTER
    # authorEmail:
    message: process.env.COMMIT_MESSAGE
    # remoteOrigin:
    pullRequestId: process.env.PULL_REQUEST
    # defaultBranch:
  }
  snap: {
    ## ???
  }
  teamcity: {
    ## ???
  }
  teamfoundation: {
    ## ???
  }
  travis: {
    sha: process.env.TRAVIS_COMMIT
    ## for PRs, TRAVIS_BRANCH is the base branch being merged into
    branch: process.env.TRAVIS_PULL_REQUEST_BRANCH or process.env.TRAVIS_BRANCH
    # authorName:
    # authorEmail:
    message: process.env.TRAVIS_COMMIT_MESSAGE
    # remoteOrigin:
    pullRequestId: process.env.TRAVIS_PULL_REQUEST
    # defaultBranch:
  }
  wercker: {
    # ???
  }
}[provider] or {})[key]

module.exports = {
  getCirclePrNumber

  name: ->
    getProviderName()

  params: ->
    params(getProviderName()) ? null

  buildNum: ->
    buildNums(getProviderName()) ? null

  groupId: ->
    groupIds(getProviderName()) ? null

  gitInfo: (existingInfo) ->
    providerName = getProviderName()
    _.transform existingInfo, (info, existingValue, key) ->
      info[key] = existingValue ? (getGitInfo(providerName, key) ? null)
    , {}
}
