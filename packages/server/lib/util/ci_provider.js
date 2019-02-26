// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const debug = require('debug')('cypress:server')

const join = (char, ...pieces) => {
  return _.chain(pieces).compact().join(char).value()
}

const toCamelObject = (obj, key) => {
  return _.set(obj, _.camelCase(key), process.env[key])
}

const extract = (envKeys) => {
  return _.transform(envKeys, toCamelObject, {})
}

const isCodeshipBasic = () => {
  return process.env.CI_NAME && (process.env.CI_NAME === 'codeship') && process.env.CODESHIP
}

const isCodeshipPro = () => {
  return process.env.CI_NAME && (process.env.CI_NAME === 'codeship') && !process.env.CODESHIP
}

const isGitlab = () => {
  return process.env.GITLAB_CI || (process.env.CI_SERVER_NAME && /^GitLab/.test(process.env.CI_SERVER_NAME))
}

const isJenkins = () => {
  return process.env.JENKINS_URL ||
    process.env.JENKINS_HOME ||
    process.env.JENKINS_VERSION ||
    process.env.HUDSON_URL ||
    process.env.HUDSON_HOME
}

const isWercker = () => {
  return process.env.WERCKER || process.env.WERCKER_MAIN_PIPELINE_STARTED
}

// top level detection of CI providers by environment variable
// or a predicate function
const CI_PROVIDERS = {
  'appveyor': 'APPVEYOR',
  'bamboo': 'bamboo.buildNumber',
  'bitbucket': 'BITBUCKET_BUILD_NUMBER',
  'buildkite': 'BUILDKITE',
  'circle': 'CIRCLECI',
  'codeshipBasic': isCodeshipBasic,
  'codeshipPro': isCodeshipPro,
  'drone': 'DRONE',
  'gitlab': isGitlab,
  'jenkins': isJenkins,
  'semaphore': 'SEMAPHORE',
  'shippable': 'SHIPPABLE',
  'snap': 'SNAP_CI',
  'teamcity': 'TEAMCITY_VERSION',
  'teamfoundation': 'TF_BUILD',
  'travis': 'TRAVIS',
  'wercker': isWercker,
}

const _detectProviderName = function () {
  const { env } = process

  //# return the key of the first provider
  //# which is truthy
  return _.findKey(CI_PROVIDERS, (value) => {
    if (_.isString(value)) {
      return env[value]
    }

    if (_.isFunction(value)) {
      return value()
    }
  })
}

//# TODO: dont forget about buildNumber!
//# look at the old commit that was removed to see how we did it
const _providerCiParams = () => {
  return {
    appveyor: extract([
      'APPVEYOR_JOB_ID',
      'APPVEYOR_ACCOUNT_NAME',
      'APPVEYOR_PROJECT_SLUG',
      'APPVEYOR_BUILD_NUMBER',
      'APPVEYOR_BUILD_VERSION',
      'APPVEYOR_PULL_REQUEST_NUMBER',
      'APPVEYOR_PULL_REQUEST_HEAD_REPO_BRANCH',
    ]),
    bamboo: extract([
      'bamboo.resultsUrl',
      'bamboo.buildNumber',
      'bamboo.buildResultsUrl',
      'bamboo.planRepository.repositoryUrl',
    ]),
    bitbucket: extract([
      'BITBUCKET_REPO_SLUG',
      'BITBUCKET_REPO_OWNER',
      'BITBUCKET_BUILD_NUMBER',
    ]),
    buildkite: extract([
      'BUILDKITE_REPO',
      'BUILDKITE_SOURCE',
      'BUILDKITE_JOB_ID',
      'BUILDKITE_BUILD_ID',
      'BUILDKITE_BUILD_URL',
      'BUILDKITE_BUILD_NUMBER',
      'BUILDKITE_PULL_REQUEST',
      'BUILDKITE_PULL_REQUEST_REPO',
      'BUILDKITE_PULL_REQUEST_BASE_BRANCH',
    ]),
    circle: extract([
      'CIRCLE_JOB',
      'CIRCLE_BUILD_NUM',
      'CIRCLE_BUILD_URL',
      'CIRCLE_PR_NUMBER',
      'CIRCLE_PR_REPONAME',
      'CIRCLE_PR_USERNAME',
      'CIRCLE_COMPARE_URL',
      'CIRCLE_WORKFLOW_ID',
      'CIRCLE_PULL_REQUEST',
      'CIRCLE_REPOSITORY_URL',
      'CI_PULL_REQUEST',
    ]),
    codeshipBasic: extract([
      'CI_BUILD_ID',
      'CI_REPO_NAME',
      'CI_BUILD_URL',
      'CI_PROJECT_ID',
      'CI_BUILD_NUMBER',
      'CI_PULL_REQUEST',
    ]),
    // CodeshipPro provides very few CI variables
    // https://documentation.codeship.com/pro/builds-and-configuration/environment-variables/
    codeshipPro: extract([
      'CI_BUILD_ID',
      'CI_REPO_NAME',
      'CI_PROJECT_ID',
    ]),
    drone: extract([
      'DRONE_JOB_NUMBER',
      'DRONE_BUILD_LINK',
      'DRONE_BUILD_NUMBER',
      'DRONE_PULL_REQUEST',
    ]),
    // see https://docs.gitlab.com/ee/ci/variables/
    gitlab: extract([
    // pipeline is common among all jobs
      'CI_PIPELINE_ID',
      'CI_PIPELINE_URL',
      // individual jobs
      'CI_BUILD_ID', // build id and job id are aliases
      'CI_JOB_ID',
      'CI_JOB_URL',
      // other information
      'GITLAB_HOST',
      'CI_PROJECT_ID',
      'CI_PROJECT_URL',
      'CI_REPOSITORY_URL',
      'CI_ENVIRONMENT_URL',
    //# for PRs: https://gitlab.com/gitlab-org/gitlab-ce/issues/23902
    ]),
    jenkins: extract([
      'BUILD_ID',
      'BUILD_URL',
      'BUILD_NUMBER',
      'ghprbPullId',
    ]),
    // https://semaphoreci.com/docs/available-environment-variables.html
    semaphore: extract([
      'SEMAPHORE_BRANCH_ID',
      'SEMAPHORE_BUILD_NUMBER',
      'SEMAPHORE_CURRENT_JOB',
      'SEMAPHORE_CURRENT_THREAD',
      'SEMAPHORE_EXECUTABLE_UUID',
      'SEMAPHORE_JOB_COUNT',
      'SEMAPHORE_JOB_UUID',
      'SEMAPHORE_PLATFORM',
      'SEMAPHORE_PROJECT_DIR',
      'SEMAPHORE_PROJECT_HASH_ID',
      'SEMAPHORE_PROJECT_NAME',
      'SEMAPHORE_PROJECT_UUID',
      'SEMAPHORE_REPO_SLUG',
      'SEMAPHORE_TRIGGER_SOURCE',
      'PULL_REQUEST_NUMBER', // pull requests from forks ONLY
    ]),

    // see http://docs.shippable.com/ci/env-vars/
    shippable: extract([
    //# build variables
      'SHIPPABLE_BUILD_ID', // "5b93354cabfabb07007f01fd"
      'SHIPPABLE_BUILD_NUMBER', // "4"
      'SHIPPABLE_COMMIT_RANGE', // "sha1...sha2"
      'SHIPPABLE_CONTAINER_NAME', // "c.exec.cypress-example-kitchensink.4.1"
      'SHIPPABLE_JOB_ID', // "1"
      'SHIPPABLE_JOB_NUMBER', // "1"
      'SHIPPABLE_REPO_SLUG', // "<username>/<repo>"
      //# additional information that Shippable provides
      'IS_FORK', // "true"
      'IS_GIT_TAG', // "false"
      'IS_PRERELEASE', // "false"
      'IS_RELEASE', // "false"
      'REPOSITORY_URL', // "https://github.com/....git"
      'REPO_FULL_NAME', // "<username>/<repo>"
      'REPO_NAME', // "cypress-example-kitchensink"
      'BUILD_URL', // "https://app.shippable.com/github/<username>/<repo>/runs/1"
      //# Pull request information
      'BASE_BRANCH', // Name of the target branch into which the pull request changes will be merged.
      'HEAD_BRANCH', // This is only set for pull requests and is the name of the branch the pull request was opened from.
      'IS_PULL_REQUEST', // "false" or "true"
      'PULL_REQUEST', // Pull request number if the job is a pull request. If not, this will be set to false.
      'PULL_REQUEST_BASE_BRANCH', // Name of the branch that the pull request will be merged into. It should be the same as BASE_BRANCH.
      'PULL_REQUEST_REPO_FULL_NAME', // Full name of the repository from where the pull request originated.
    ]),
    snap: null,
    teamcity: null,
    teamfoundation: extract([
      'BUILD_BUILDID',
      'BUILD_BUILDNUMBER',
      'BUILD_CONTAINERID',
    ]),
    travis: extract([
      'TRAVIS_JOB_ID',
      'TRAVIS_BUILD_ID',
      'TRAVIS_REPO_SLUG',
      'TRAVIS_JOB_NUMBER',
      'TRAVIS_EVENT_TYPE',
      'TRAVIS_COMMIT_RANGE',
      'TRAVIS_BUILD_NUMBER',
      'TRAVIS_PULL_REQUEST',
      'TRAVIS_PULL_REQUEST_BRANCH',
    ]),
    wercker: null,
  }
}

// tries to grab commit information from CI environment variables
// very useful to fill missing information when Git cannot grab correct values
const _providerCommitParams = function () {
  const { env } = process

  return {
    appveyor: {
      sha: env.APPVEYOR_REPO_COMMIT,
      branch: env.APPVEYOR_REPO_BRANCH,
      message: join('\n', env.APPVEYOR_REPO_COMMIT_MESSAGE, env.APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED),
      authorName: env.APPVEYOR_REPO_COMMIT_AUTHOR,
      authorEmail: env.APPVEYOR_REPO_COMMIT_AUTHOR_EMAIL,
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    bamboo: {
      // sha: ???
      branch: env['bamboo.planRepository.branch'],
      // message: ???
      // authorName: ???
      // authorEmail: ???
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    bitbucket: {
      sha: env.BITBUCKET_COMMIT,
      branch: env.BITBUCKET_BRANCH,
    },
    buildkite: {
      sha: env.BUILDKITE_COMMIT,
      branch: env.BUILDKITE_BRANCH,
      message: env.BUILDKITE_MESSAGE,
      authorName: env.BUILDKITE_BUILD_CREATOR,
      authorEmail: env.BUILDKITE_BUILD_CREATOR_EMAIL,
      remoteOrigin: env.BUILDKITE_REPO,
      defaultBranch: env.BUILDKITE_PIPELINE_DEFAULT_BRANCH,
    },
    circle: {
      sha: env.CIRCLE_SHA1,
      branch: env.CIRCLE_BRANCH,
      // message: ???
      authorName: env.CIRCLE_USERNAME,
      // authorEmail: ???
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    codeshipBasic: {
      sha: env.CI_COMMIT_ID,
      branch: env.CI_BRANCH,
      message: env.CI_COMMIT_MESSAGE,
      authorName: env.CI_COMMITTER_NAME,
      authorEmail: env.CI_COMMITTER_EMAIL,
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    codeshipPro: {
      sha: env.CI_COMMIT_ID,
      branch: env.CI_BRANCH,
      message: env.CI_COMMIT_MESSAGE,
      authorName: env.CI_COMMITTER_NAME,
      authorEmail: env.CI_COMMITTER_EMAIL,
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    drone: {
      sha: env.DRONE_COMMIT_SHA,
      branch: env.DRONE_COMMIT_BRANCH,
      message: env.DRONE_COMMIT_MESSAGE,
      authorName: env.DRONE_COMMIT_AUTHOR,
      authorEmail: env.DRONE_COMMIT_AUTHOR_EMAIL,
      // remoteOrigin: ???
      defaultBranch: env.DRONE_REPO_BRANCH,
    },
    gitlab: {
      sha: env.CI_COMMIT_SHA,
      branch: env.CI_COMMIT_REF_NAME,
      message: env.CI_COMMIT_MESSAGE,
      authorName: env.GITLAB_USER_NAME,
      authorEmail: env.GITLAB_USER_EMAIL,
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    jenkins: {
      sha: env.GIT_COMMIT,
      branch: env.GIT_BRANCH,
      // message: ???
      // authorName: ???
      // authorEmail: ???
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    //# Only from forks? https://semaphoreci.com/docs/available-environment-variables.html
    semaphore: {
      sha: env.REVISION,
      branch: env.BRANCH_NAME,
      // message: ???
      // authorName: ???
      // authorEmail: ???
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    shippable: {
      sha: env.COMMIT,
      branch: env.BRANCH,
      message: env.COMMIT_MESSAGE,
      authorName: env.COMMITTER,
      // authorEmail: ???
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    snap: null,
    teamcity: null,
    teamfoundation: {
      sha: env.BUILD_SOURCEVERSION,
      branch: env.BUILD_SOURCEBRANCHNAME,
      message: env.BUILD_SOURCEVERSIONMESSAGE,
      authorName: env.BUILD_SOURCEVERSIONAUTHOR,
    },
    travis: {
      sha: env.TRAVIS_COMMIT,
      //# for PRs, TRAVIS_BRANCH is the base branch being merged into
      branch: env.TRAVIS_PULL_REQUEST_BRANCH || env.TRAVIS_BRANCH,
      // authorName: ???
      // authorEmail: ???
      message: env.TRAVIS_COMMIT_MESSAGE,
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    wercker: null,
  }
}

const provider = function () {
  return _detectProviderName() || null
}

const omitUndefined = function (ret) {
  if (_.isObject(ret)) {
    return _.omitBy(ret, _.isUndefined)
  }
}

const _get = (fn) => {
  return _
  .chain(fn())
  .get(provider())
  .thru(omitUndefined)
  .defaultTo(null)
  .value()
}

const ciParams = () => {
  return _get(_providerCiParams)
}

const commitParams = () => {
  return _get(_providerCommitParams)
}

const commitDefaults = function (existingInfo) {
  debug('git commit existing info')
  debug(existingInfo)

  const providerName = provider()

  debug('detected provider name: %s', providerName)

  let commitParamsObj = commitParams()

  if (!commitParamsObj) {
    debug('could not get commit param object, using empty one')
    commitParamsObj = {}
  }

  debug('commit info from provider environment variables')
  debug('%o', commitParamsObj)

  // based on the existingInfo properties
  // merge in the commitParams if null or undefined
  // defaulting back to null if all fails
  // NOTE: only properties defined in "existingInfo" will be returned
  const combined = _.transform(existingInfo, (memo, value, key) => {
    return memo[key] = _.defaultTo(value != null ? value : commitParamsObj[key], null)
  })

  debug('combined git and environment variables from provider')
  debug(combined)

  return combined
}

const list = () => {
  return _.keys(CI_PROVIDERS)
}

// grab all detectable providers
// that we can extract ciBuildId from
const detectableCiBuildIdProviders = () => {
  return _
  .chain(_providerCiParams())
  .omitBy(_.isNull)
  .keys()
  .value()
}

module.exports = {
  list,

  provider,

  ciParams,

  commitParams,

  commitDefaults,

  detectableCiBuildIdProviders,
}
