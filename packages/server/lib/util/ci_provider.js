const _ = require('lodash')
const isCi = require('ci-info').isCI
const debug = require('debug')('cypress:server')

const getIsCi = () => isCi

const join = (char, ...pieces) => {
  return _.chain(pieces).compact().join(char).value()
}

const toCamelObject = (obj, key) => {
  return _.set(obj, _.camelCase(key), process.env[key])
}

const extract = (envKeys) => {
  return _.transform(envKeys, toCamelObject, {})
}

/**
 * Returns true if running on TeamFoundation server.
 * @see https://technet.microsoft.com/en-us/hh850448(v=vs.92)
 */
const isTeamFoundation = () => {
  return process.env.TF_BUILD && process.env.TF_BUILD_BUILDNUMBER
}

/**
 * Returns true if running on Azure CI pipeline.
 * See environment variables in the issue #3657
 * @see https://github.com/cypress-io/cypress/issues/3657
*/
const isAzureCi = () => {
  return process.env.TF_BUILD && process.env.AZURE_HTTP_USER_AGENT
}

const isAWSCodeBuild = () => {
  return _.some(process.env, (val, key) => {
    return /^CODEBUILD_/.test(key)
  })
}

const isBamboo = () => {
  return process.env.bamboo_buildNumber
}

const isCodeshipBasic = () => {
  return process.env.CI_NAME && (process.env.CI_NAME === 'codeship') && process.env.CODESHIP
}

const isCodeshipPro = () => {
  return process.env.CI_NAME && (process.env.CI_NAME === 'codeship') && !process.env.CODESHIP
}

const isConcourse = () => {
  return _.some(process.env, (val, key) => {
    return /^CONCOURSE_/.test(key)
  })
}

const isGitlab = () => {
  return process.env.GITLAB_CI || (process.env.CI_SERVER_NAME && /^GitLab/.test(process.env.CI_SERVER_NAME))
}

const isGoogleCloud = () => {
  // set automatically for the Node.js 6, Node.js 8 runtimes (not in Node 10)
  // TODO: may also potentially have X_GOOGLE_* env var set
  // https://cloud.google.com/functions/docs/env-var#environment_variables_set_automatically
  return process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
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

/**
 * We detect CI providers by detecting an environment variable
 * unique to the provider, or by calling a function that returns true
 * for that provider.
 *
 * For example, AppVeyor CI has environment the
 * variable "APPVEYOR" set during run
 */
const CI_PROVIDERS = {
  'appveyor': 'APPVEYOR',
  'azure': isAzureCi,
  'awsCodeBuild': isAWSCodeBuild,
  'bamboo': isBamboo,
  'bitbucket': 'BITBUCKET_BUILD_NUMBER',
  'buildkite': 'BUILDKITE',
  'circle': 'CIRCLECI',
  'codeshipBasic': isCodeshipBasic,
  'codeshipPro': isCodeshipPro,
  'concourse': isConcourse,
  codeFresh: 'CF_BUILD_ID',
  'drone': 'DRONE',
  githubActions: 'GITHUB_ACTIONS',
  'gitlab': isGitlab,
  'goCD': 'GO_JOB_NAME',
  'googleCloud': isGoogleCloud,
  'jenkins': isJenkins,
  'semaphore': 'SEMAPHORE',
  'shippable': 'SHIPPABLE',
  'teamcity': 'TEAMCITY_VERSION',
  'teamfoundation': isTeamFoundation,
  'travis': 'TRAVIS',
  'wercker': isWercker,
  netlify: 'NETLIFY',
  webappio: 'WEBAPPIO',
}

const _detectProviderName = () => {
  const { env } = process
  // return the key of the first provider
  // which is truthy

  return _.findKey(CI_PROVIDERS, (value) => {
    if (_.isString(value)) {
      return env[value]
    }

    if (_.isFunction(value)) {
      return value()
    }
  })
}

// User provided environment variables are used to allow users to define their own
// values should the CI provider not have an existing or correct mapping from the list below.
const _userProvidedProviderCiParams = () => {
  return extract([
    'CYPRESS_PULL_REQUEST_ID',
    'CYPRESS_PULL_REQUEST_URL',
    'CYPRESS_CI_BUILD_URL',
  ])
}
// TODO: don't forget about buildNumber!
// look at the old commit that was removed to see how we did it
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
    // https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables
    azure: extract([
      'BUILD_BUILDID',
      'BUILD_BUILDNUMBER',
      'BUILD_CONTAINERID',
      'BUILD_REPOSITORY_URI',
      'SYSTEM_JOBID',
      'SYSTEM_STAGEATTEMPT',
      'SYSTEM_PHASEATTEMPT',
      'SYSTEM_JOBATTEMPT',
      'SYSTEM_PLANID',
      'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER',
      'SYSTEM_PULLREQUEST_TARGETBRANCH',
      'SYSTEM_PULLREQUEST_TARGETBRANCHNAME',
    ]),
    awsCodeBuild: extract([
      'CODEBUILD_BUILD_ID',
      'CODEBUILD_BUILD_NUMBER',
      'CODEBUILD_RESOLVED_SOURCE_VERSION',
      'CODEBUILD_SOURCE_REPO_URL',
      'CODEBUILD_SOURCE_VERSION',
    ]),
    bamboo: extract([
      'bamboo_buildNumber',
      'bamboo_buildResultsUrl',
      'bamboo_planRepository_repositoryUrl',
      'bamboo_buildKey',
    ]),
    bitbucket: extract([
      'BITBUCKET_REPO_SLUG',
      'BITBUCKET_REPO_OWNER',
      'BITBUCKET_BUILD_NUMBER',
      'BITBUCKET_PARALLEL_STEP',
      'BITBUCKET_STEP_RUN_NUMBER',
      // the PR variables are only set on pull request builds
      'BITBUCKET_PR_ID',
      'BITBUCKET_PR_DESTINATION_BRANCH',
      'BITBUCKET_PR_DESTINATION_COMMIT',
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
      'BUILDKITE_RETRY_COUNT',
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
      'CIRCLE_WORKFLOW_JOB_ID',
      'CIRCLE_PIPELINE_ID',
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
      'CI_PR_NUMBER',
      'CI_PULL_REQUEST',
    ]),
    // https://concourse-ci.org/implementing-resource-types.html#resource-metadata
    concourse: extract([
      'BUILD_ID',
      'BUILD_NAME',
      'BUILD_JOB_NAME',
      'BUILD_PIPELINE_NAME',
      'BUILD_TEAM_NAME',
      'ATC_EXTERNAL_URL',
    ]),
    // https://codefresh.io/docs/docs/codefresh-yaml/variables/
    codeFresh: extract([
      'CF_BUILD_ID',
      'CF_BUILD_URL',
      'CF_CURRENT_ATTEMPT',
      'CF_STEP_NAME',
      'CF_PIPELINE_NAME',
      'CF_PIPELINE_TRIGGER_ID',
      // variables added for pull requests
      'CF_PULL_REQUEST_ID',
      'CF_PULL_REQUEST_IS_FORK',
      'CF_PULL_REQUEST_NUMBER',
      'CF_PULL_REQUEST_TARGET',
    ]),
    drone: extract([
      'DRONE_JOB_NUMBER',
      'DRONE_BUILD_LINK',
      'DRONE_BUILD_NUMBER',
      'DRONE_PULL_REQUEST',
    ]),
    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/using-environment-variables#default-environment-variables
    githubActions: extract([
      'GITHUB_WORKFLOW',
      'GITHUB_ACTION',
      'GITHUB_EVENT_NAME',
      'GITHUB_RUN_ID',
      'GITHUB_RUN_ATTEMPT',
      'GITHUB_REPOSITORY',
      'GITHUB_BASE_REF',
      'GITHUB_HEAD_REF',
      'GITHUB_REF_NAME',
      'GITHUB_REF',
      'GITHUB_JOB',
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
      'CI_JOB_NAME',
      // other information
      'GITLAB_HOST',
      'CI_PROJECT_ID',
      'CI_PROJECT_URL',
      'CI_REPOSITORY_URL',
      'CI_ENVIRONMENT_URL',
      'CI_DEFAULT_BRANCH',
      // for PRs: https://gitlab.com/gitlab-org/gitlab-ce/issues/23902
      'CI_MERGE_REQUEST_SOURCE_BRANCH_NAME',
      'CI_MERGE_REQUEST_SOURCE_BRANCH_SHA',
    ]),
    // https://docs.gocd.org/current/faq/dev_use_current_revision_in_build.html#standard-gocd-environment-variables
    goCD: extract([
      'GO_SERVER_URL',
      'GO_ENVIRONMENT_NAME',
      'GO_PIPELINE_NAME',
      'GO_PIPELINE_COUNTER',
      'GO_PIPELINE_LABEL',
      'GO_STAGE_NAME',
      'GO_STAGE_COUNTER',
      'GO_JOB_NAME',
      'GO_TRIGGER_USER',
      'GO_REVISION',
      'GO_TO_REVISION',
      'GO_FROM_REVISION',
      'GO_MATERIAL_HAS_CHANGED',
    ]),
    googleCloud: extract([
      // individual jobs
      'BUILD_ID',
      'PROJECT_ID',
      // other information
      'REPO_NAME',
      'BRANCH_NAME',
      'TAG_NAME',
      'COMMIT_SHA',
      'SHORT_SHA',
      '_HEAD_BRANCH',
      '_BASE_BRANCH',
      '_PR_NUMBER',
      // https://cloud.google.com/cloud-build/docs/api/reference/rest/Shared.Types/Build
    ]),
    /**
     * References:
     * https://ci.eclipse.org/webtools/env-vars.html/
     * https://www.jenkins.io/doc/book/pipeline/multibranch/#additional-environment-variables
     */
    jenkins: extract([
      'BUILD_ID',
      'BUILD_URL',
      'BUILD_NUMBER',
      'ghprbPullId',
      // Jenkins pipeline options change options
      'CHANGE_ID',
      'CHANGE_URL',
      'CHANGE_TARGET',
      'CHANGE_TITLE',
    ]),
    // https://semaphoreci.com/docs/available-environment-variables.html
    // some come from v1, some from v2 of semaphore
    semaphore: extract([
      'SEMAPHORE_BRANCH_ID',
      'SEMAPHORE_BUILD_NUMBER',
      'SEMAPHORE_CURRENT_JOB',
      'SEMAPHORE_CURRENT_THREAD',
      'SEMAPHORE_EXECUTABLE_UUID',
      'SEMAPHORE_GIT_BRANCH',
      'SEMAPHORE_GIT_DIR',
      'SEMAPHORE_GIT_PR_NUMBER',
      'SEMAPHORE_GIT_REF',
      'SEMAPHORE_GIT_REF_TYPE',
      'SEMAPHORE_GIT_REPO_SLUG',
      'SEMAPHORE_GIT_SHA',
      'SEMAPHORE_GIT_URL',
      'SEMAPHORE_GIT_WORKING_BRANCH',
      'SEMAPHORE_JOB_COUNT',
      'SEMAPHORE_JOB_ID', // v2
      'SEMAPHORE_JOB_NAME',
      'SEMAPHORE_JOB_UUID', // v1
      'SEMAPHORE_PIPELINE_ID',
      'SEMAPHORE_PLATFORM',
      'SEMAPHORE_PROJECT_DIR',
      'SEMAPHORE_PROJECT_HASH_ID',
      'SEMAPHORE_PROJECT_ID', // v2
      'SEMAPHORE_PROJECT_NAME',
      'SEMAPHORE_PROJECT_UUID', // v1
      'SEMAPHORE_REPO_SLUG',
      'SEMAPHORE_TRIGGER_SOURCE',
      'SEMAPHORE_WORKFLOW_ID',
      'PULL_REQUEST_NUMBER', // pull requests from forks ONLY
    ]),
    // see http://docs.shippable.com/ci/env-vars/
    shippable: extract([
    // build variables
      'SHIPPABLE_BUILD_ID', // "5b93354cabfabb07007f01fd"
      'SHIPPABLE_BUILD_NUMBER', // "4"
      'SHIPPABLE_COMMIT_RANGE', // "sha1...sha2"
      'SHIPPABLE_CONTAINER_NAME', // "c.exec.cypress-example-kitchensink.4.1"
      'SHIPPABLE_JOB_ID', // "1"
      'SHIPPABLE_JOB_NUMBER', // "1"
      'SHIPPABLE_REPO_SLUG', // "<username>/<repo>"
      // additional information that Shippable provides
      'IS_FORK', // "true"
      'IS_GIT_TAG', // "false"
      'IS_PRERELEASE', // "false"
      'IS_RELEASE', // "false"
      'REPOSITORY_URL', // "https://github.com/....git"
      'REPO_FULL_NAME', // "<username>/<repo>"
      'REPO_NAME', // "cypress-example-kitchensink"
      'BUILD_URL', // "https://app.shippable.com/github/<username>/<repo>/runs/1"
      // Pull request information
      'BASE_BRANCH', // Name of the target branch into which the pull request changes will be merged.
      'HEAD_BRANCH', // This is only set for pull requests and is the name of the branch the pull request was opened from.
      'IS_PULL_REQUEST', // "false" or "true"
      'PULL_REQUEST', // Pull request number if the job is a pull request. If not, this will be set to false.
      'PULL_REQUEST_BASE_BRANCH', // Name of the branch that the pull request will be merged into. It should be the same as BASE_BRANCH.
      'PULL_REQUEST_REPO_FULL_NAME', // Full name of the repository from where the pull request originated.
    ]),
    teamcity: null,
    teamfoundation: extract([
      'BUILD_BUILDID',
      'BUILD_BUILDNUMBER',
      'BUILD_CONTAINERID',
    ]),
    travis: extract([
      'TRAVIS_JOB_ID',
      'TRAVIS_BUILD_ID',
      'TRAVIS_BUILD_WEB_URL',
      'TRAVIS_REPO_SLUG',
      'TRAVIS_JOB_NUMBER',
      'TRAVIS_EVENT_TYPE',
      'TRAVIS_COMMIT_RANGE',
      'TRAVIS_BUILD_NUMBER',
      'TRAVIS_PULL_REQUEST',
      'TRAVIS_PULL_REQUEST_BRANCH',
      'TRAVIS_PULL_REQUEST_SHA',
    ]),
    wercker: null,
    // https://docs.netlify.com/configure-builds/environment-variables/#deploy-urls-and-metadata
    netlify: extract([
      'BUILD_ID',
      'CONTEXT',
      'URL',
      'DEPLOY_URL',
      'DEPLOY_PRIME_URL',
      'DEPLOY_ID',
    ]),
    // https://docs.webapp.io/layerfile-reference/build-env
    webappio: extract([
      'JOB_ID',
      'RUNNER_ID',
      'RETRY_INDEX',
      'PULL_REQUEST_URL',
      'REPOSITORY_NAME',
      'REPOSITORY_OWNER',
      'GIT_BRANCH',
      'GIT_TAG', // short hex for commits
    ]),
  }
}

// tries to grab commit information from CI environment variables
// very useful to fill missing information when Git cannot grab correct values
const _providerCommitParams = () => {
  const { env } = process

  return {
    appveyor: {
      sha: env.APPVEYOR_REPO_COMMIT,
      // since APPVEYOR_REPO_BRANCH will be the target branch on a PR
      // we need to use PULL_REQUEST_HEAD_REPO_BRANCH if it exists.
      // e.g. if you have a PR: develop <- my-feature-branch
      // my-feature-branch is APPVEYOR_PULL_REQUEST_HEAD_REPO_BRANCH
      // develop           is APPVEYOR_REPO_BRANCH
      branch: env.APPVEYOR_PULL_REQUEST_HEAD_REPO_BRANCH || env.APPVEYOR_REPO_BRANCH,
      message: join('\n', env.APPVEYOR_REPO_COMMIT_MESSAGE, env.APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED),
      authorName: env.APPVEYOR_REPO_COMMIT_AUTHOR,
      authorEmail: env.APPVEYOR_REPO_COMMIT_AUTHOR_EMAIL,
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    awsCodeBuild: {
      sha: env.CODEBUILD_RESOLVED_SOURCE_VERSION,
      // branch: ???,
      // message: ???
      // authorName: ???
      // authorEmail: ???
      remoteOrigin: env.CODEBUILD_SOURCE_REPO_URL,
      // defaultBranch: ???
    },
    azure: {
      sha: env.BUILD_SOURCEVERSION,
      branch: env.BUILD_SOURCEBRANCHNAME,
      message: env.BUILD_SOURCEVERSIONMESSAGE,
      authorName: env.BUILD_SOURCEVERSIONAUTHOR,
      authorEmail: env.BUILD_REQUESTEDFOREMAIL,
    },
    bamboo: {
      sha: env.bamboo_planRepository_revision,
      branch: env.bamboo_planRepository_branch,
      // message: ???
      authorName: env.bamboo_planRepository_username,
      // authorEmail: ???
      remoteOrigin: env.bamboo_planRepository_repositoryURL,
      // defaultBranch: ???
    },
    bitbucket: {
      sha: env.BITBUCKET_COMMIT,
      branch: env.BITBUCKET_BRANCH,
      // message: ???
      // authorName: ???
      // authorEmail: ???
      // remoteOrigin: ???
      // defaultBranch: ???
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
    codeFresh: {
      sha: env.CF_REVISION,
      branch: env.CF_BRANCH,
      message: env.CF_COMMIT_MESSAGE,
      authorName: env.CF_COMMIT_AUTHOR,
    },
    drone: {
      sha: env.DRONE_COMMIT_SHA,
      // https://docs.drone.io/pipeline/environment/reference/drone-source-branch/
      branch: env.DRONE_SOURCE_BRANCH,
      message: env.DRONE_COMMIT_MESSAGE,
      authorName: env.DRONE_COMMIT_AUTHOR,
      authorEmail: env.DRONE_COMMIT_AUTHOR_EMAIL,
      remoteOrigin: env.DRONE_GIT_HTTP_URL,
      defaultBranch: env.DRONE_REPO_BRANCH,
    },
    githubActions: {
      sha: env.GITHUB_SHA,
      // GH_BRANCH       - populated with HEAD branch by cypress/github-action
      // GITHUB_HEAD_REF - populated with the head ref or source branch
      //                   of the pull request in a workflow run and is
      //                   otherwise unset
      // GITHUB_REF_NAME - populated with short ref name of the branch or
      //                   tag that triggered the workflow run
      branch: env.GH_BRANCH || env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME,
      defaultBranch: env.GITHUB_BASE_REF,
      remoteBranch: env.GITHUB_HEAD_REF,
      runAttempt: env.GITHUB_RUN_ATTEMPT,
    },
    gitlab: {
      sha: env.CI_COMMIT_SHA,
      branch: env.CI_COMMIT_REF_NAME,
      message: env.CI_COMMIT_MESSAGE,
      authorName: env.GITLAB_USER_NAME,
      authorEmail: env.GITLAB_USER_EMAIL,
      remoteOrigin: env.CI_REPOSITORY_URL,
      defaultBranch: env.CI_DEFAULT_BRANCH,
    },
    googleCloud: {
      sha: env.COMMIT_SHA,
      branch: env.BRANCH_NAME,
      // message: ??
      // authorName: ??
      // authorEmail: ??
      // remoteOrigin: ???
      // defaultBranch: ??
    },
    jenkins: {
      sha: env.GIT_COMMIT,
      branch: env.GIT_BRANCH || env.BRANCH_NAME || env.CHANGE_BRANCH,
      // message: ??,
      authorName: env.GIT_AUTHOR_NAME || env.CHANGE_AUTHOR_DISPLAY_NAME,
      authorEmail: env.GIT_AUTHOR_EMAIL || env.CHANGE_AUTHOR_EMAIL,
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    // Only from forks? https://semaphoreci.com/docs/available-environment-variables.html
    semaphore: {
      sha: env.SEMAPHORE_GIT_SHA,
      branch: env.SEMAPHORE_GIT_WORKING_BRANCH,
      // message: ???
      // authorName: ???
      // authorEmail: ???
      remoteOrigin: env.SEMAPHORE_GIT_REPO_SLUG,
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
      sha: env.TRAVIS_PULL_REQUEST_SHA || env.TRAVIS_COMMIT,
      // for PRs, TRAVIS_BRANCH is the base branch being merged into
      branch: env.TRAVIS_PULL_REQUEST_BRANCH || env.TRAVIS_BRANCH,
      // authorName: ???
      // authorEmail: ???
      message: env.TRAVIS_COMMIT_MESSAGE,
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    wercker: null,
    netlify: {
      sha: env.COMMIT_REF,
      branch: env.BRANCH,
      remoteOrigin: env.REPOSITORY_URL,
    },
    webappio: {
      sha: env.GIT_COMMIT,
      branch: env.GIT_BRANCH,
      message: env.GIT_COMMIT_TITLE,
    },
  }
}

const provider = () => {
  return _detectProviderName() || null
}

const omitUndefined = (ret) => {
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
  const ciParams = {
    ..._.chain(_userProvidedProviderCiParams()).thru(omitUndefined).defaultTo(null).value(),
    ..._get(_providerCiParams),
  }

  return Object.keys(ciParams).length > 0 ? ciParams : null
}

const commitParams = () => {
  return _get(_providerCommitParams)
}

const commitDefaults = (existingInfo) => {
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
    return memo[key] = _.defaultTo(value || commitParamsObj[key], null)
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
  getIsCi,

  list,

  provider,

  ciParams,

  commitParams,

  commitDefaults,

  detectableCiBuildIdProviders,
}
