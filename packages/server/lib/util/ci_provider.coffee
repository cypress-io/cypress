_ = require("lodash")
la = require("lazy-ass")
check = require("check-more-types")

join = (char, pieces...) ->
  _.chain(pieces).compact().join(char).value()

toCamelObject = (obj, key) ->
  _.set(obj, _.camelCase(key), process.env[key])

extract = (envKeys) ->
  _.transform(envKeys, toCamelObject, {})

isCodeship = ->
  process.env.CI_NAME and process.env.CI_NAME is "codeship"

isGitlab = ->
  process.env.GITLAB_CI or (process.env.CI_SERVER_NAME and process.env.CI_SERVER_NAME is "GitLab CI")

isJenkins = ->
  process.env.JENKINS_URL or
    process.env.JENKINS_HOME or
    process.env.JENKINS_VERSION or
    process.env.HUDSON_URL or
    process.env.HUDSON_HOME

isWercker = ->
  process.env.WERCKER or process.env.WERCKER_MAIN_PIPELINE_STARTED

CI_PROVIDERS = {
  "appveyor":       "APPVEYOR"
  "bamboo":         "bamboo.buildNumber"
  "buildkite":      "BUILDKITE"
  "circle":         "CIRCLECI"
  "codeship":       isCodeship
  "drone":          "DRONE"
  "gitlab":         isGitlab
  "jenkins":        isJenkins
  "semaphore":      "SEMAPHORE"
  "shippable":      "SHIPPABLE"
  "snap":           "SNAP_CI"
  "teamcity":       "TEAMCITY_VERSION"
  "teamfoundation": "TF_BUILD"
  "travis":          "TRAVIS"
  "wercker":         isWercker
}

_detectProviderName = ->
  { env } = process

  ## return the key of the first provider
  ## which is truthy
  _.findKey CI_PROVIDERS, (value, key) ->
    switch
      when _.isString(value)
        env[value]
      when _.isFunction(value)
        value()

## TODO: dont forget about buildNumber!
## look at the old commit that was removed to see how we did it
_providerCiParams = ->
  return {
    appveyor: extract([
      "APPVEYOR_JOB_ID"
      "APPVEYOR_ACCOUNT_NAME"
      "APPVEYOR_PROJECT_SLUG"
      "APPVEYOR_BUILD_NUMBER"
      "APPVEYOR_BUILD_VERSION"
      "APPVEYOR_PULL_REQUEST_NUMBER"
      "APPVEYOR_PULL_REQUEST_HEAD_REPO_BRANCH"
    ])
    bamboo: extract([
      "bamboo.resultsUrl"
      "bamboo.buildNumber"
      "bamboo.buildResultsUrl"
      "bamboo.planRepository.repositoryUrl"
    ])
    buildkite: extract([
      "BUILDKITE_REPO"
      "BUILDKITE_SOURCE"
      "BUILDKITE_JOB_ID"
      "BUILDKITE_BUILD_ID"
      "BUILDKITE_BUILD_URL"
      "BUILDKITE_BUILD_NUMBER"
      "BUILDKITE_PULL_REQUEST"
      "BUILDKITE_PULL_REQUEST_REPO"
      "BUILDKITE_PULL_REQUEST_BASE_BRANCH"
    ])
    circle: extract([
      "CIRCLE_JOB"
      "CIRCLE_BUILD_NUM"
      "CIRCLE_BUILD_URL"
      "CIRCLE_PR_NUMBER"
      "CIRCLE_PR_REPONAME"
      "CIRCLE_PR_USERNAME"
      "CIRCLE_COMPARE_URL"
      "CIRCLE_WORKFLOW_ID"
      "CIRCLE_PULL_REQUEST"
      "CIRCLE_REPOSITORY_URL"
      "CI_PULL_REQUEST"
    ])
    codeship: extract([
      "CI_BUILD_ID"
      "CI_REPO_NAME"
      "CI_BUILD_URL"
      "CI_PROJECT_ID"
      "CI_BUILD_NUMBER"
      "CI_PULL_REQUEST"
    ])
    drone: extract([
      "DRONE_JOB_NUMBER"
      "DRONE_BUILD_LINK"
      "DRONE_BUILD_NUMBER"
      "DRONE_PULL_REQUEST"
    ])
    gitlab: extract([
      "CI_JOB_ID"
      "CI_JOB_URL"
      "CI_BUILD_ID"
      "GITLAB_HOST"
      "CI_PROJECT_ID"
      "CI_PROJECT_URL"
      "CI_REPOSITORY_URL"
      "CI_ENVIRONMENT_URL"
      ## for PRs: https://gitlab.com/gitlab-org/gitlab-ce/issues/23902
    ])
    jenkins: extract([
      "BUILD_ID"
      "BUILD_URL"
      "BUILD_NUMBER"
      "ghprbPullId"
    ])
    semaphore: extract([
      "SEMAPHORE_REPO_SLUG"
      "SEMAPHORE_BUILD_NUMBER"
      "SEMAPHORE_PROJECT_NAME"
      "SEMAPHORE_TRIGGER_SOURCE"
      "PULL_REQUEST_NUMBER"
    ])
    shippable: extract([
      "JOB_ID"
      "BUILD_URL"
      "PROJECT_ID"
      "JOB_NUMBER"
      "COMPARE_URL"
      "BASE_BRANCH"
      "BUILD_NUMBER"
      "PULL_REQUEST"
      "REPOSITORY_URL"
      "PULL_REQUEST_BASE_BRANCH"
      "PULL_REQUEST_REPO_FULL_NAME"
    ])
    snap: null
    teamcity: null
    teamfoundation: null
    travis: extract([
      "TRAVIS_JOB_ID"
      "TRAVIS_BUILD_ID"
      "TRAVIS_REPO_SLUG"
      "TRAVIS_JOB_NUMBER"
      "TRAVIS_EVENT_TYPE"
      "TRAVIS_COMMIT_RANGE"
      "TRAVIS_BUILD_NUMBER"
      "TRAVIS_PULL_REQUEST"
      "TRAVIS_PULL_REQUEST_BRANCH"
    ])
    wercker: null
  }

_providerCommitParams = ->
  { env } = process

  return {
    appveyor: {
      sha: env.APPVEYOR_REPO_COMMIT
      branch: env.APPVEYOR_REPO_BRANCH
      message: join('\n', env.APPVEYOR_REPO_COMMIT_MESSAGE, env.APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED)
      authorName: env.APPVEYOR_REPO_COMMIT_AUTHOR
      authorEmail: env.APPVEYOR_REPO_COMMIT_AUTHOR_EMAIL
      # remoteOrigin: ???
      # defaultBranch: ???
    }
    bamboo: {
      # sha: ???
      branch: env["bamboo.planRepository.branch"]
      # message: ???
      # authorName: ???
      # authorEmail: ???
      # remoteOrigin: ???
      # defaultBranch: ???
    }
    buildkite: {
      sha: env.BUILDKITE_COMMIT
      branch: env.BUILDKITE_BRANCH
      message: env.BUILDKITE_MESSAGE
      authorName: env.BUILDKITE_BUILD_CREATOR
      authorEmail: env.BUILDKITE_BUILD_CREATOR_EMAIL
      remoteOrigin: env.BUILDKITE_REPO
      defaultBranch: env.BUILDKITE_PIPELINE_DEFAULT_BRANCH
    }
    circle: {
      sha: env.CIRCLE_SHA1
      branch: env.CIRCLE_BRANCH
      # message: ???
      authorName: env.CIRCLE_USERNAME
      # authorEmail: ???
      # remoteOrigin: ???
      # defaultBranch: ???
    }
    codeship: {
      sha: env.CI_COMMIT_ID
      branch: env.CI_BRANCH
      message: env.CI_COMMIT_MESSAGE
      authorName: env.CI_COMMITTER_NAME
      authorEmail: env.CI_COMMITTER_EMAIL
      # remoteOrigin: ???
      # defaultBranch: ???
    }
    drone: {
      sha: env.DRONE_COMMIT_SHA
      branch: env.DRONE_COMMIT_BRANCH
      message: env.DRONE_COMMIT_MESSAGE
      authorName: env.DRONE_COMMIT_AUTHOR
      authorEmail: env.DRONE_COMMIT_AUTHOR_EMAIL
      # remoteOrigin: ???
      defaultBranch: env.DRONE_REPO_BRANCH
    }
    gitlab: {
      sha: env.CI_COMMIT_SHA
      branch: env.CI_COMMIT_REF_NAME
      message: env.CI_COMMIT_MESSAGE
      authorName: env.GITLAB_USER_NAME
      authorEmail: env.GITLAB_USER_EMAIL
      # remoteOrigin: ???
      # defaultBranch: ???
    }
    jenkins: {
      sha: env.GIT_COMMIT
      branch: env.GIT_BRANCH
      # message: ???
      # authorName: ???
      # authorEmail: ???
      # remoteOrigin: ???
      # defaultBranch: ???
    }
    ## Only from forks? https://semaphoreci.com/docs/available-environment-variables.html
    semaphore: {
      sha: env.REVISION
      branch: env.BRANCH_NAME
      # message: ???
      # authorName: ???
      # authorEmail: ???
      # remoteOrigin: ???
      # defaultBranch: ???
    }
    shippable: {
      sha: env.COMMIT
      branch: env.BRANCH
      message: env.COMMIT_MESSAGE
      authorName: env.COMMITTER
      # authorEmail: ???
      # remoteOrigin: ???
      # defaultBranch: ???
    }
    snap: null
    teamcity: null
    teamfoundation: null
    travis: {
      sha: env.TRAVIS_COMMIT
      ## for PRs, TRAVIS_BRANCH is the base branch being merged into
      branch: env.TRAVIS_PULL_REQUEST_BRANCH or env.TRAVIS_BRANCH
      # authorName: ???
      # authorEmail: ???
      message: env.TRAVIS_COMMIT_MESSAGE
      # remoteOrigin: ???
      # defaultBranch: ???
    }
    wercker: null
  }

provider = ->
  _detectProviderName() ? null

omitUndefined = (ret) ->
  if _.isObject(ret)
    _.omitBy(ret, _.isUndefined)

_get = (fn) ->
  _
  .chain(fn())
  .get(provider())
  .thru(omitUndefined)
  .defaultTo(null)
  .value()

ciParams = ->
  _get(_providerCiParams)

commitParams = ->
  _get(_providerCommitParams)

commitDefaults = (existingInfo) ->
  commitParamsObj = commitParams() or {}

  ## based on the existingInfo properties
  ## merge in the commitParams if null or undefined
  ## defaulting back to null if all fails
  _.transform existingInfo, (memo, value, key) ->
    memo[key] = _.defaultTo(value ? commitParamsObj[key], null)

list = ->
  _.keys(CI_PROVIDERS)

detectableCiBuildIdProviders = ->
  ## grab all detectable providers
  ## that we can extract ciBuildId from
  _
  .chain(_providerCiParams())
  .omitBy(_.isNull)
  .keys()
  .value()

module.exports = {
  list

  provider

  ciParams

  commitParams

  commitDefaults

  detectableCiBuildIdProviders

}
