import _ from 'lodash'
import { isCI } from 'ci-info'
import debugModule from 'debug'

const debug = debugModule('cypress:server')

export const getIsCi = () => isCI

const join = (char: string, ...pieces: (string | undefined)[]) => {
  return _.chain(pieces).compact().join(char).value()
}

const toCamelObject = (obj, key) => {
  return _.set(obj, _.camelCase(key), process.env[key])
}

const extract = (envKeys) => {
  return _.transform(envKeys, toCamelObject, {})
}

// The Jenkins Git plugin populates GIT_BRANCH with the remote-qualified
// branch name (e.g. "origin/main" or "refs/remotes/origin/main"). Recording
// the remote prefix causes the branch to not match the actual branch name in
// Cypress Cloud, so strip the default "origin" remote prefix.
// https://github.com/cypress-io/cypress/issues/20833
const stripGitRemotePrefix = (branch?: string) => {
  return branch && branch.replace(/^(refs\/remotes\/)?origin\//, '')
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

// AWS Amplify Console / Amplify Hosting
// Ref: https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html
const isAWSAmplifyConsole = () => {
  // Some Amplify build types/environments may not expose AWS_JOB_ID.
  // Prefer a more robust detection based on other Amplify-built-in variables
  // so we don't fall back to generic CodeBuild detection and change metadata.
  return process.env.AWS_APP_ID && Boolean(
    process.env.AWS_JOB_ID ||
    process.env.AWS_BRANCH ||
    process.env.AWS_COMMIT_ID ||
    process.env.AWS_BRANCH_ARN ||
    process.env.AWS_CLONE_URL ||
    process.env.AWS_PULL_REQUEST_ID,
  )
}

const isBamboo = () => {
  return process.env.bamboo_buildNumber
}

// Harness CI exposes both HARNESS_* and DRONE_* environment variables.
// Ref: https://developer.harness.io/docs/continuous-integration/troubleshoot-ci/ci-env-var/#codebase-and-trigger-variables
const isHarnessCi = () => {
  return _.some(process.env, (val, key) => /^HARNESS_/.test(key))
}

const isDroneCi = () => {
  // Drone (and Harness CI) set DRONE_* env vars.
  // But Drone standalone has no HARNESS_* env vars.
  return process.env.DRONE || _.some(process.env, (val, key) => /^DRONE_/.test(key))
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

// Argo CD injects build env vars during manifest generation (Helm, Kustomize, CMPs).
// Ref: https://argo-cd.readthedocs.io/en/stable/user-guide/build-environment/
const isArgoCd = () => {
  return Boolean(process.env.ARGOCD_APP_NAME && process.env.ARGOCD_APP_REVISION)
}

// Argo Workflows injects executor env vars on workflow pods.
// Ref: https://github.com/argoproj/argo-workflows/blob/main/workflow/common/common.go
const isArgoWorkflows = () => {
  // Injected together on workflow executor pods; avoids matching unrelated ARGO_* operator env vars.
  return Boolean(process.env.ARGO_WORKFLOW_NAME && process.env.ARGO_NODE_ID)
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
  argoCd: isArgoCd,
  argoWorkflows: isArgoWorkflows,
  'azure': isAzureCi,
  // Amplify Console runs on CodeBuild and can expose CODEBUILD_* env vars.
  // Since provider detection picks the first match, the more specific provider
  // must be listed before the generic CodeBuild detection.
  awsAmplifyConsole: isAWSAmplifyConsole,
  'awsCodeBuild': isAWSCodeBuild,
  'bamboo': isBamboo,
  'bitbucket': 'BITBUCKET_BUILD_NUMBER',
  buddy: 'BUDDY',
  bitrise: 'BITRISE_IO',
  'buildkite': 'BUILDKITE',
  'circle': 'CIRCLECI',
  // CloudBees Unify runs workflows in a CloudBees-managed workspace directory.
  // The official CloudBees checkout action checks out repositories under $CLOUDBEES_WORKSPACE.
  // Ref: https://raw.githubusercontent.com/cloudbees-io/checkout/v1/README.adoc
  cloudbeesUnify: 'CLOUDBEES_WORKSPACE',
  'concourse': isConcourse,
  codeFresh: 'CF_BUILD_ID',
  // Harness CI check must be before Drone CI check
  harness: isHarnessCi,
  'drone': isDroneCi,
  githubActions: 'GITHUB_ACTIONS',
  'gitlab': isGitlab,
  'goCD': 'GO_JOB_NAME',
  'googleCloud': isGoogleCloud,
  'jenkins': isJenkins,
  'semaphore': 'SEMAPHORE',
  'teamcity': 'TEAMCITY_VERSION',
  'travis': 'TRAVIS',
  netlify: 'NETLIFY',
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

    return undefined
  })
}

// User provided environment variables are used to allow users to define their own
// values should the CI provider not have an existing or correct mapping from the list below.
const _userProvidedProviderCiParams = () => {
  return extract([
    'CYPRESS_PULL_REQUEST_ID',
    'CYPRESS_PULL_REQUEST_URL',
    'CYPRESS_CI_BUILD_URL',
    // Users can set these to override automatic detection of a rerun or enable
    // it for unsupported CI providers
    'CYPRESS_RERUN_GROUP_ID', // ID shared by a run and its retries
    'CYPRESS_RERUN_ALL_TESTS', // Opt out of only rerunning failed tests and force all tests to be rerun
  ])
}
// TODO: don't forget about buildNumber!
// look at the old commit that was removed to see how we did it
const _providerCiParams = () => {
  return {
    // https://www.appveyor.com/docs/environment-variables/
    appveyor: extract([
      'APPVEYOR_JOB_ID',
      'APPVEYOR_ACCOUNT_NAME',
      'APPVEYOR_PROJECT_SLUG',
      'APPVEYOR_BUILD_NUMBER',
      'APPVEYOR_BUILD_VERSION',
      'APPVEYOR_PULL_REQUEST_NUMBER',
      'APPVEYOR_PULL_REQUEST_HEAD_REPO_BRANCH',
    ]),
    // https://argo-cd.readthedocs.io/en/stable/user-guide/build-environment/
    argoCd: extract([
      'ARGOCD_APP_NAME',
      'ARGOCD_APP_NAMESPACE',
      'ARGOCD_APP_PROJECT_NAME',
      'ARGOCD_APP_REVISION',
      'ARGOCD_APP_REVISION_SHORT',
      'ARGOCD_APP_REVISION_SHORT_8',
      'ARGOCD_APP_SOURCE_PATH',
      'ARGOCD_APP_SOURCE_REPO_URL',
      'ARGOCD_APP_SOURCE_TARGET_REVISION',
      'KUBE_VERSION',
      'KUBE_API_VERSIONS',
    ]),
    // https://github.com/argoproj/argo-workflows/blob/main/workflow/common/common.go
    argoWorkflows: extract([
      'ARGO_WORKFLOW_NAME',
      'ARGO_WORKFLOW_UID',
      'ARGO_NODE_ID',
      'ARGO_POD_NAME',
      'ARGO_POD_UID',
      'ARGO_CONTAINER_NAME',
      'ARGO_INSTANCE_ID',
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
      'SYSTEM_TEAMPROJECT',
      'BUILD_DEFINITIONNAME',
    ]),
    awsCodeBuild: extract([
      'CODEBUILD_BUILD_ID',
      'CODEBUILD_BUILD_ARN',
      'CODEBUILD_BUILD_NUMBER',
      'CODEBUILD_RESOLVED_SOURCE_VERSION',
      'CODEBUILD_SOURCE_REPO_URL',
      'CODEBUILD_SOURCE_VERSION',
    ]),
    // https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html
    awsAmplifyConsole: extract([
      'AWS_APP_ID',
      'AWS_BRANCH',
      'AWS_BRANCH_ARN',
      'AWS_JOB_ID',
      'AWS_CLONE_URL',
      'AWS_COMMIT_ID',
      // PR preview builds
      'AWS_PULL_REQUEST_ID',
      'AWS_PULL_REQUEST_SOURCE_BRANCH',
      'AWS_PULL_REQUEST_DESTINATION_BRANCH',
    ]),
    // https://buddy.works/docs/basics/environment-variables/default-variables
    buddy: extract([
      // The ID of the current pipeline run: '1'
      'BUDDY_RUN_ID',
      // The number of the currently run pull request: '27'
      'BUDDY_RUN_PR_NO',
      // The URL of the current pipeline run
      'BUDDY_RUN_URL',
      // The name of the Git branch of the current pipeline run
      'BUDDY_RUN_BRANCH',
      // The SHA1 hash of the commit of the current pipeline run
      'BUDDY_RUN_COMMIT',
      // The commit message of the currently run commit
      'BUDDY_RUN_COMMIT_MESSAGE',
      // The name of the committer of the currently run commit
      'BUDDY_RUN_COMMIT_COMMITTER_NAME',
      // The email address of the committer email of the currently run commit
      'BUDDY_RUN_COMMIT_COMMITTER_EMAIL',
      // The SSH URL of the repository
      'BUDDY_REPO_SSH_URL',
    ]),
    // https://docs.bitrise.io/en/bitrise-ci/references/available-environment-variables.html
    bitrise: extract([
      'BITRISE_BUILD_NUMBER',
      'BITRISE_BUILD_URL',
      'BITRISE_BUILD_SLUG',
      'BITRISE_APP_SLUG',
      'GIT_REPOSITORY_URL',
      'BITRISE_GIT_BRANCH',
      'BITRISEIO_GIT_BRANCH_DEST',
      'BITRISE_PULL_REQUEST',
    ]),
    // https://confluence.atlassian.com/bamboo/bamboo-variables-289277087.html
    bamboo: extract([
      'bamboo_buildNumber',
      'bamboo_buildResultsUrl',
      'bamboo_planRepository_repositoryUrl',
      'bamboo_buildKey',
    ]),
    // https://support.atlassian.com/bitbucket-cloud/docs/variables-and-secrets/
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
      'BITBUCKET_PIPELINE_UUID',
    ]),
    // https://buildkite.com/docs/pipelines/configure/environment-variables
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
    // https://circleci.com/docs/reference/variables/
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
      'CIRCLE_PROJECT_REPONAME',
      'CIRCLE_WORKFLOW_WORKSPACE_ID',
    ]),
    cloudbeesUnify: extract([
      'CLOUDBEES_WORKSPACE',
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
    // https://developer.harness.io/docs/continuous-integration/troubleshoot-ci/ci-env-var/#codebase-and-trigger-variables
    harness: extract([
      'HARNESS_BUILD_ID',
      'HARNESS_EXECUTION_ID',
      'HARNESS_PIPELINE_ID',
      'HARNESS_PROJECT_ID',
      'HARNESS_ORG_ID',
      'HARNESS_ACCOUNT_ID',
      'HARNESS_STAGE_ID',
      // build/run links and identifiers (often exposed as DRONE_* as well)
      'CI_BUILD_LINK',
      'CI_BUILD_NUMBER',
      'DRONE_BUILD_LINK',
      'DRONE_BUILD_NUMBER',
      // PR + repo metadata
      'DRONE_PULL_REQUEST',
      'DRONE_REPO',
    ]),
    drone: extract([
      'DRONE_JOB_NUMBER',
      'DRONE_BUILD_LINK',
      'DRONE_BUILD_NUMBER',
      'DRONE_PULL_REQUEST',
    ]),
    // https://docs.github.com/en/actions/reference/workflows-and-actions/variables
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
    // see https://docs.gitlab.com/ci/variables/predefined_variables/
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
    // https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#using-environment-variables
    jenkins: extract([
      'BUILD_ID',
      'BUILD_TAG',
      'BUILD_URL',
      'BUILD_NUMBER',
      'ghprbPullId',
      // Jenkins pipeline options change options
      'CHANGE_ID',
      'CHANGE_URL',
      'CHANGE_TARGET',
      'CHANGE_TITLE',
    ]),
    // https://docs.semaphore.io/reference/env-vars
    semaphore: extract([
      'SEMAPHORE_BRANCH_ID',
      'SEMAPHORE_BUILD_NUMBER',
      'SEMAPHORE_CURRENT_JOB',
      'SEMAPHORE_CURRENT_THREAD',
      'SEMAPHORE_EXECUTABLE_UUID',
      'SEMAPHORE_GIT_BRANCH',
      'SEMAPHORE_GIT_COMMIT_AUTHOR',
      'SEMAPHORE_GIT_COMMITTER',
      'SEMAPHORE_GIT_DIR',
      'SEMAPHORE_GIT_PR_BRANCH',
      'SEMAPHORE_GIT_PR_NAME',
      'SEMAPHORE_GIT_PR_NUMBER',
      'SEMAPHORE_GIT_PR_SHA',
      'SEMAPHORE_GIT_PR_SLUG',
      'SEMAPHORE_GIT_REF',
      'SEMAPHORE_GIT_REF_TYPE',
      'SEMAPHORE_GIT_REPO_NAME',
      'SEMAPHORE_GIT_REPO_SLUG',
      'SEMAPHORE_GIT_SHA',
      'SEMAPHORE_GIT_TAG_NAME',
      'SEMAPHORE_GIT_URL',
      'SEMAPHORE_GIT_WORKING_BRANCH',
      'SEMAPHORE_JOB_COUNT',
      'SEMAPHORE_JOB_INDEX',
      'SEMAPHORE_JOB_ID', // v2
      'SEMAPHORE_JOB_NAME',
      'SEMAPHORE_JOB_UUID', // v1
      'SEMAPHORE_ORGANIZATION_URL',
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
      'SEMAPHORE_WORKFLOW_NUMBER',
      'PULL_REQUEST_NUMBER', // pull requests from forks ONLY
    ]),
    // https://www.jetbrains.com/help/teamcity/predefined-build-parameters.html#Predefined+Server+Build+Parameters
    teamcity: extract([
      'BUILD_NUMBER',
      'BUILD_URL',
    ]),
    // // https://docs.travis-ci.com/user/environment-variables/#default-environment-variables
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
    // https://docs.netlify.com/configure-builds/environment-variables
    netlify: extract([
      'BUILD_ID',
      'CONTEXT',
      'URL',
      'DEPLOY_URL',
      'DEPLOY_PRIME_URL',
      'DEPLOY_ID',
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
    argoCd: {
      sha: env.ARGOCD_APP_REVISION,
      branch: env.ARGOCD_APP_SOURCE_TARGET_REVISION,
      remoteOrigin: env.ARGOCD_APP_SOURCE_REPO_URL,
      // message, authorName, authorEmail, defaultBranch: not provided by Argo CD build env
    },
    argoWorkflows: {},
    awsCodeBuild: {
      sha: env.CODEBUILD_RESOLVED_SOURCE_VERSION,
      // branch: ???,
      // message: ???
      // authorName: ???
      // authorEmail: ???
      remoteOrigin: env.CODEBUILD_SOURCE_REPO_URL,
      // defaultBranch: ???
    },
    awsAmplifyConsole: {
      sha: env.AWS_COMMIT_ID,
      branch: env.AWS_PULL_REQUEST_SOURCE_BRANCH || env.AWS_BRANCH,
      remoteOrigin: env.AWS_CLONE_URL,
      // defaultBranch: ???
    },
    buddy: {
      sha: env.BUDDY_RUN_COMMIT,
      branch: env.BUDDY_RUN_BRANCH,
      message: env.BUDDY_RUN_COMMIT_MESSAGE,
      authorName: env.BUDDY_RUN_COMMIT_COMMITTER_NAME,
      authorEmail: env.BUDDY_RUN_COMMIT_COMMITTER_EMAIL,
      remoteOrigin: env.BUDDY_REPO_SSH_URL,
      // defaultBranch: ???
    },
    bitrise: {
      sha: env.BITRISE_GIT_COMMIT || env.GIT_CLONE_COMMIT_HASH,
      branch: env.BITRISE_GIT_BRANCH,
      message: env.BITRISE_GIT_MESSAGE,
      authorName: env.GIT_CLONE_COMMIT_AUTHOR_NAME,
      authorEmail: env.GIT_CLONE_COMMIT_AUTHOR_EMAIL,
      remoteOrigin: env.GIT_REPOSITORY_URL,
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
    cloudbeesUnify: {},
    codeFresh: {
      sha: env.CF_REVISION,
      branch: env.CF_BRANCH,
      message: env.CF_COMMIT_MESSAGE,
      authorName: env.CF_COMMIT_AUTHOR,
    },
    // https://developer.harness.io/docs/continuous-integration/troubleshoot-ci/ci-env-var/#codebase-and-trigger-variables
    harness: {
      sha: env.CI_COMMIT_SHA || env.DRONE_COMMIT_SHA || env.DRONE_COMMIT,
      branch: env.DRONE_SOURCE_BRANCH || env.DRONE_BRANCH || env.CI_COMMIT_BRANCH,
      message: env.CI_COMMIT_MESSAGE || env.DRONE_COMMIT_MESSAGE,
      authorName: env.CI_COMMIT_AUTHOR || env.DRONE_COMMIT_AUTHOR || env.CI_COMMIT_AUTHOR_NAME || env.DRONE_COMMIT_AUTHOR_NAME,
      authorEmail: env.CI_COMMIT_AUTHOR_EMAIL || env.DRONE_COMMIT_AUTHOR_EMAIL,
      remoteOrigin: env.CI_REPO_REMOTE || env.DRONE_GIT_HTTP_URL || env.DRONE_GIT_SSH_URL,
      defaultBranch: env.DRONE_REPO_BRANCH,
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
      // GIT_LOCAL_BRANCH and BRANCH_NAME (multibranch pipeline plugin) hold the
      // unprefixed branch name, so prefer them over GIT_BRANCH, which the Git
      // plugin prefixes with the remote name (e.g. "origin/main").
      branch: env.GIT_LOCAL_BRANCH || env.BRANCH_NAME || stripGitRemotePrefix(env.GIT_BRANCH) || env.CHANGE_BRANCH,
      // message: ??,
      authorName: env.GIT_AUTHOR_NAME || env.CHANGE_AUTHOR_DISPLAY_NAME,
      authorEmail: env.GIT_AUTHOR_EMAIL || env.CHANGE_AUTHOR_EMAIL,
      // remoteOrigin: ???
      // defaultBranch: ???
    },
    // https://docs.semaphore.io/reference/env-vars
    semaphore: {
      sha: env.SEMAPHORE_GIT_SHA,
      branch: env.SEMAPHORE_GIT_WORKING_BRANCH || env.SEMAPHORE_GIT_BRANCH,
      // message: ???
      authorName: env.SEMAPHORE_GIT_COMMIT_AUTHOR || env.SEMAPHORE_GIT_COMMITTER,
      // authorEmail: ???
      remoteOrigin: env.SEMAPHORE_GIT_URL || env.SEMAPHORE_GIT_REPO_SLUG,
      // defaultBranch: ???
    },
    snap: null,
    // TeamCity does not expose standardized commit metadata via env vars by default.
    // branch: not a predefined env var; may be configured via custom parameters
    // message: ???
    // authorName: ???
    // authorEmail: ???
    // remoteOrigin: ???
    // defaultBranch: ???
    teamcity: null,
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
    netlify: {
      sha: env.COMMIT_REF,
      branch: env.BRANCH,
      remoteOrigin: env.REPOSITORY_URL,
    },
  }
}

export const provider = () => {
  return _detectProviderName() || null
}

const omitUndefined = (ret) => {
  if (_.isObject(ret)) {
    return _.omitBy(ret, _.isUndefined)
  }

  return undefined
}

const _get = (fn) => {
  const providerName = provider()

  if (!providerName) return null

  return _
  .chain(fn())
  .get(providerName)
  .thru(omitUndefined)
  .defaultTo(null)
  .value()
}

export const ciParams = () => {
  const ciParams = {
    ..._.chain(_userProvidedProviderCiParams()).thru(omitUndefined).defaultTo(null).value(),
    ..._get(_providerCiParams),
  }

  return Object.keys(ciParams).length > 0 ? ciParams : null
}

export const commitParams = () => {
  return _get(_providerCommitParams)
}

export const commitDefaults = (existingInfo: Record<string, string | null | undefined>) => {
  debug('git commit existing info')
  debug(existingInfo)

  const providerName = provider()

  debug('detected provider name: %s', providerName)

  let commitParamsObj = commitParams()

  if (!commitParamsObj) {
    debug('could not get commit param object, using empty one')
    commitParamsObj = {}
  }

  const resolvedCommitParamsObj: Record<string, any> = commitParamsObj

  debug('commit info from provider environment variables')
  debug('%o', resolvedCommitParamsObj)

  // based on the existingInfo properties
  // merge in the commitParams if null or undefined
  // defaulting back to null if all fails
  // NOTE: only properties defined in "existingInfo" will be returned
  const combined = _.transform(existingInfo, (memo: Record<string, string | null | undefined>, value, key) => {
    memo[key] = _.defaultTo(value || resolvedCommitParamsObj[key], null)
  }, {} as Record<string, string | null | undefined>)

  debug('combined git and environment variables from provider')
  debug(combined)

  return combined
}

export const list = () => {
  return _.keys(CI_PROVIDERS)
}

// grab all detectable providers
// that we can extract ciBuildId from
export const detectableCiBuildIdProviders = () => {
  return _
  .chain(_providerCiParams())
  .omitBy(_.isNil)
  .keys()
  .sortBy()
  .value()
}
