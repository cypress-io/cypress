import '../../spec_helper'
import mockedEnv from 'mocked-env'

import * as ciProvider from '../../../lib/util/ci_provider'

const expectsName = (name) => {
  expect(ciProvider.provider(), 'CI providers detected name').to.eq(name)
}

const expectsCiParams = (params) => {
  expect(ciProvider.ciParams(), 'CI providers detected CI params').to.deep.eq(params)
}

const expectsCommitParams = (params) => {
  expect(ciProvider.commitParams(), 'CI providers detected commit params').to.deep.eq(params)
}

const expectsCommitDefaults = function (existing, expected) {
  expect(expected).to.be.an('object')

  expect(ciProvider.commitDefaults(existing), 'CI providers default git params').to.deep.eq(expected)
}

describe('lib/util/ci_provider', () => {
  let resetEnv = null

  afterEach(() => {
    // we need to reset environment
    // to avoid affecting tests in other suites
    return typeof resetEnv === 'function' ? resetEnv() : undefined
  })

  it('null when unknown', () => {
    resetEnv = mockedEnv({}, { clear: true })

    expectsName(null)
    expectsCiParams(null)

    return expectsCommitParams(null)
  })

  it('allows for user provided environment variables', () => {
    resetEnv = mockedEnv({
      CYPRESS_PULL_REQUEST_ID: 'cypressPullRequestId',
      CYPRESS_PULL_REQUEST_URL: 'cypressPullRequestUrl',
      CYPRESS_CI_BUILD_URL: 'cypressCiBuildUrl',
    }, { clear: true })

    expectsName(null)
    expectsCiParams({
      cypressPullRequestId: 'cypressPullRequestId',
      cypressPullRequestUrl: 'cypressPullRequestUrl',
      cypressCiBuildUrl: 'cypressCiBuildUrl',
    })

    return expectsCommitParams(null)
  })

  it('does not extract from commit environment variables yet', () => {
    // see fallback environment variables
    // https://github.com/cypress-io/commit-info#fallback-environment-variables
    // BUT those defaults are NOT used by "ci_provider"
    // instead they are used in the "record" module
    // this test just confirms that these defaults are not considered
    const env = {
      COMMIT_INFO_BRANCH: 'my-branch-221',
      COMMIT_INFO_MESSAGE: 'best commit ever',
      COMMIT_INFO_EMAIL: 'user@company.com',
      COMMIT_INFO_AUTHOR: 'Agent Smith',
      COMMIT_INFO_SHA: '0123456',
      COMMIT_INFO_REMOTE: 'remote repo',
    }

    resetEnv = mockedEnv(env, { clear: true })

    expectsName(null) // we don't know CI
    expectsCiParams(null) // we don't know CI params

    return expectsCommitParams(null)
  }) // we don't know CI-specific params

  it('detectableCiBuildIdProviders lists supported providers alphabetically', () => {
    // This list is used in user-facing error messaging.
    const providers = ciProvider.detectableCiBuildIdProviders()

    expect(providers).to.deep.eq([
      'appveyor',
      'awsAmplifyConsole',
      'awsCodeBuild',
      'azure',
      'bamboo',
      'bitbucket',
      'bitrise',
      'buddy',
      'buildkite',
      'circle',
      'cloudbeesUnify',
      'codeFresh',
      'concourse',
      'drone',
      'githubActions',
      'gitlab',
      'goCD',
      'googleCloud',
      'harness',
      'jenkins',
      'netlify',
      'semaphore',
      'teamcity',
      'travis',
    ])

    // Confirm the returned list is already sorted (not just matching this test's ordering).
    expect(providers).to.deep.eq([...providers].sort())
  })

  it('appveyor', () => {
    resetEnv = mockedEnv({
      APPVEYOR: 'true',

      APPVEYOR_JOB_ID: 'appveyorJobId2',
      APPVEYOR_ACCOUNT_NAME: 'appveyorAccountName',
      APPVEYOR_PROJECT_SLUG: 'appveyorProjectSlug',
      APPVEYOR_BUILD_VERSION: 'appveyorBuildVersion',
      APPVEYOR_BUILD_NUMBER: 'appveyorBuildNumber',
      APPVEYOR_PULL_REQUEST_NUMBER: 'appveyorPullRequestNumber',
      APPVEYOR_PULL_REQUEST_HEAD_REPO_BRANCH: 'appveyorPullRequestHeadRepoBranch',

      APPVEYOR_REPO_COMMIT: 'repoCommit',
      APPVEYOR_REPO_COMMIT_MESSAGE: 'repoCommitMessage',
      APPVEYOR_REPO_BRANCH: 'repoBranch',
      APPVEYOR_REPO_COMMIT_AUTHOR: 'repoCommitAuthor',
      APPVEYOR_REPO_COMMIT_AUTHOR_EMAIL: 'repoCommitAuthorEmail',
    }, { clear: true })

    expectsName('appveyor')
    expectsCiParams({
      appveyorJobId: 'appveyorJobId2',
      appveyorAccountName: 'appveyorAccountName',
      appveyorProjectSlug: 'appveyorProjectSlug',
      appveyorBuildNumber: 'appveyorBuildNumber',
      appveyorBuildVersion: 'appveyorBuildVersion',
      appveyorPullRequestNumber: 'appveyorPullRequestNumber',
      appveyorPullRequestHeadRepoBranch: 'appveyorPullRequestHeadRepoBranch',
    })

    expectsCommitParams({
      sha: 'repoCommit',
      branch: 'appveyorPullRequestHeadRepoBranch',
      message: 'repoCommitMessage',
      authorName: 'repoCommitAuthor',
      authorEmail: 'repoCommitAuthorEmail',
    })

    resetEnv()

    resetEnv = mockedEnv({
      APPVEYOR: 'true',
      APPVEYOR_REPO_COMMIT_MESSAGE: 'repoCommitMessage',
      APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED: 'repoCommitMessageExtended',
    }, { clear: true })

    return expectsCommitParams({
      message: 'repoCommitMessage\nrepoCommitMessageExtended',
    })
  })

  it('awsCodeBuild', () => {
    resetEnv = mockedEnv({
      CODEBUILD_BUILD_ID: 'codebuild-demo-project:b1e6661e-e4f2-4156-9ab9-82a19EXAMPLE',
      CODEBUILD_BUILD_ARN: 'arn:aws:codebuild:us-west-2:123456789012:build/codebuild-demo-project:b1e6661e-e4f2-4156-9ab9-82a19EXAMPLE',
      CODEBUILD_BUILD_NUMBER: '123',
      CODEBUILD_RESOLVED_SOURCE_VERSION: 'commit',
      CODEBUILD_SOURCE_REPO_URL: 'repositoryUrl',
      CODEBUILD_SOURCE_VERSION: 'commitOrBranchOrTag',
    }, { clear: true })

    expectsName('awsCodeBuild')
    expectsCiParams({
      codebuildBuildId: 'codebuild-demo-project:b1e6661e-e4f2-4156-9ab9-82a19EXAMPLE',
      codebuildBuildArn: 'arn:aws:codebuild:us-west-2:123456789012:build/codebuild-demo-project:b1e6661e-e4f2-4156-9ab9-82a19EXAMPLE',
      codebuildBuildNumber: '123',
      codebuildResolvedSourceVersion: 'commit',
      codebuildSourceRepoUrl: 'repositoryUrl',
      codebuildSourceVersion: 'commitOrBranchOrTag',
    })

    return expectsCommitParams({
      sha: 'commit',
      remoteOrigin: 'repositoryUrl',
    })
  })

  it('aws amplify console', () => {
    resetEnv = mockedEnv({
      AWS_APP_ID: 'abcd1234',
      AWS_BRANCH: 'main',
      AWS_BRANCH_ARN: 'aws:arn:amplify:us-west-2:123456789012:apps/abcd1234/branches/main',
      AWS_JOB_ID: '0000000001',
      AWS_CLONE_URL: 'git@github.com:octocat/hello-world.git',
      AWS_COMMIT_ID: 'commitSha',
      AWS_PULL_REQUEST_ID: '12',
      AWS_PULL_REQUEST_SOURCE_BRANCH: 'featureA',
      AWS_PULL_REQUEST_DESTINATION_BRANCH: 'main',
    }, { clear: true })

    expectsName('awsAmplifyConsole')
    expectsCiParams({
      awsAppId: 'abcd1234',
      awsBranch: 'main',
      awsBranchArn: 'aws:arn:amplify:us-west-2:123456789012:apps/abcd1234/branches/main',
      awsJobId: '0000000001',
      awsCloneUrl: 'git@github.com:octocat/hello-world.git',
      awsCommitId: 'commitSha',
      awsPullRequestId: '12',
      awsPullRequestSourceBranch: 'featureA',
      awsPullRequestDestinationBranch: 'main',
    })

    return expectsCommitParams({
      sha: 'commitSha',
      branch: 'featureA',
      remoteOrigin: 'git@github.com:octocat/hello-world.git',
    })
  })

  it('aws amplify console (prefers amplify over codebuild)', () => {
    resetEnv = mockedEnv({
      // Real Amplify builds can also expose CODEBUILD_* env vars, since Amplify uses CodeBuild under the hood.
      // Ensure we detect the more-specific Amplify provider instead of awsCodeBuild.
      CODEBUILD_BUILD_ID: 'codebuild-demo-project:b1e6661e-e4f2-4156-9ab9-82a19EXAMPLE',
      CODEBUILD_SOURCE_REPO_URL: 'repositoryUrl',
      CODEBUILD_RESOLVED_SOURCE_VERSION: 'codebuildCommitSha',

      AWS_APP_ID: 'abcd1234',
      AWS_BRANCH: 'main',
      AWS_BRANCH_ARN: 'aws:arn:amplify:us-west-2:123456789012:apps/abcd1234/branches/main',
      AWS_JOB_ID: '0000000001',
      AWS_CLONE_URL: 'git@github.com:octocat/hello-world.git',
      AWS_COMMIT_ID: 'amplifyCommitSha',
      AWS_PULL_REQUEST_ID: '12',
      AWS_PULL_REQUEST_SOURCE_BRANCH: 'featureA',
      AWS_PULL_REQUEST_DESTINATION_BRANCH: 'main',
    }, { clear: true })

    expectsName('awsAmplifyConsole')
    expectsCiParams({
      awsAppId: 'abcd1234',
      awsBranch: 'main',
      awsBranchArn: 'aws:arn:amplify:us-west-2:123456789012:apps/abcd1234/branches/main',
      awsJobId: '0000000001',
      awsCloneUrl: 'git@github.com:octocat/hello-world.git',
      awsCommitId: 'amplifyCommitSha',
      awsPullRequestId: '12',
      awsPullRequestSourceBranch: 'featureA',
      awsPullRequestDestinationBranch: 'main',
    })

    return expectsCommitParams({
      sha: 'amplifyCommitSha',
      branch: 'featureA',
      remoteOrigin: 'git@github.com:octocat/hello-world.git',
    })
  })

  it('aws amplify console (missing AWS_JOB_ID does not fall back to codebuild)', () => {
    resetEnv = mockedEnv({
      // Real Amplify builds can also expose CODEBUILD_* env vars, since Amplify uses CodeBuild under the hood.
      // If AWS_JOB_ID is absent, Amplify should still be detected (and win) to avoid unexpected metadata shifts.
      CODEBUILD_BUILD_ID: 'codebuild-demo-project:b1e6661e-e4f2-4156-9ab9-82a19EXAMPLE',
      CODEBUILD_SOURCE_REPO_URL: 'repositoryUrl',
      CODEBUILD_RESOLVED_SOURCE_VERSION: 'codebuildCommitSha',

      AWS_APP_ID: 'abcd1234',
      AWS_BRANCH: 'main',
      AWS_BRANCH_ARN: 'aws:arn:amplify:us-west-2:123456789012:apps/abcd1234/branches/main',
      // AWS_JOB_ID intentionally omitted
      AWS_CLONE_URL: 'git@github.com:octocat/hello-world.git',
      AWS_COMMIT_ID: 'amplifyCommitSha',
      AWS_PULL_REQUEST_ID: '12',
      AWS_PULL_REQUEST_SOURCE_BRANCH: 'featureA',
      AWS_PULL_REQUEST_DESTINATION_BRANCH: 'main',
    }, { clear: true })

    expectsName('awsAmplifyConsole')
    expectsCiParams({
      awsAppId: 'abcd1234',
      awsBranch: 'main',
      awsBranchArn: 'aws:arn:amplify:us-west-2:123456789012:apps/abcd1234/branches/main',
      awsCloneUrl: 'git@github.com:octocat/hello-world.git',
      awsCommitId: 'amplifyCommitSha',
      awsPullRequestId: '12',
      awsPullRequestSourceBranch: 'featureA',
      awsPullRequestDestinationBranch: 'main',
    })

    return expectsCommitParams({
      sha: 'amplifyCommitSha',
      branch: 'featureA',
      remoteOrigin: 'git@github.com:octocat/hello-world.git',
    })
  })

  it('bamboo', () => {
    resetEnv = mockedEnv({
      'bamboo_buildNumber': 'bambooBuildNumber',
      'bamboo_buildResultsUrl': 'bambooBuildResultsUrl',
      'bamboo_planRepository_repositoryUrl': 'bambooPlanRepositoryRepositoryUrl',
      'bamboo_buildKey': 'bambooBuildKey',
      'bamboo_planRepository_revision': 'gitSha',
      'bamboo_planRepository_branch': 'gitBranch',
      'bamboo_planRepository_username': 'gitAuthor',
      'bamboo_planRepository_repositoryURL': 'gitRemoteOrigin',
    }, { clear: true })

    expectsName('bamboo')
    expectsCiParams({
      bambooBuildNumber: 'bambooBuildNumber',
      bambooBuildResultsUrl: 'bambooBuildResultsUrl',
      bambooPlanRepositoryRepositoryUrl: 'bambooPlanRepositoryRepositoryUrl',
      bambooBuildKey: 'bambooBuildKey',
    })

    return expectsCommitParams({
      sha: 'gitSha',
      branch: 'gitBranch',
      authorName: 'gitAuthor',
      remoteOrigin: 'gitRemoteOrigin',
    })
  })

  it('bitbucket', () => {
    resetEnv = mockedEnv({
      CI: '1',

      // build information
      BITBUCKET_BUILD_NUMBER: 'bitbucketBuildNumber',
      BITBUCKET_REPO_OWNER: 'bitbucketRepoOwner',
      BITBUCKET_REPO_SLUG: 'bitbucketRepoSlug',
      BITBUCKET_PARALLEL_STEP: 'bitbucketParallelStep',
      BITBUCKET_STEP_RUN_NUMBER: 'bitbucketStepRunNumber',

      // git information
      BITBUCKET_COMMIT: 'bitbucketCommit',
      BITBUCKET_BRANCH: 'bitbucketBranch',
    }, { clear: true })

    expectsName('bitbucket')
    expectsCiParams({
      bitbucketBuildNumber: 'bitbucketBuildNumber',
      bitbucketRepoOwner: 'bitbucketRepoOwner',
      bitbucketRepoSlug: 'bitbucketRepoSlug',
      bitbucketParallelStep: 'bitbucketParallelStep',
      bitbucketStepRunNumber: 'bitbucketStepRunNumber',
    })

    expectsCommitParams({
      sha: 'bitbucketCommit',
      branch: 'bitbucketBranch',
    })

    expectsCommitDefaults({
      sha: null,
      branch: 'gitFoundBranch',
    }, {
      sha: 'bitbucketCommit',
      branch: 'gitFoundBranch',
    })

    return expectsCommitDefaults({
      sha: undefined,
      branch: '',
    }, {
      sha: 'bitbucketCommit',
      branch: 'bitbucketBranch',
    })
  })

  it('bitbucket pull request', () => {
    resetEnv = mockedEnv({
      CI: '1',

      // build information
      BITBUCKET_BUILD_NUMBER: 'bitbucketBuildNumber',
      BITBUCKET_REPO_OWNER: 'bitbucketRepoOwner',
      BITBUCKET_REPO_SLUG: 'bitbucketRepoSlug',
      BITBUCKET_PARALLEL_STEP: 'bitbucketParallelStep',
      BITBUCKET_STEP_RUN_NUMBER: 'bitbucketStepRunNumber',

      // git information
      BITBUCKET_COMMIT: 'bitbucketCommit',
      BITBUCKET_BRANCH: 'bitbucketBranch',

      // pull request info
      BITBUCKET_PR_ID: 'bitbucketPrId',
      BITBUCKET_PR_DESTINATION_BRANCH: 'bitbucketPrDestinationBranch',
      BITBUCKET_PR_DESTINATION_COMMIT: 'bitbucketPrDestinationCommit',
    }, { clear: true })

    expectsName('bitbucket')
    expectsCiParams({
      bitbucketBuildNumber: 'bitbucketBuildNumber',
      bitbucketRepoOwner: 'bitbucketRepoOwner',
      bitbucketRepoSlug: 'bitbucketRepoSlug',
      bitbucketParallelStep: 'bitbucketParallelStep',
      bitbucketStepRunNumber: 'bitbucketStepRunNumber',
      bitbucketPrId: 'bitbucketPrId',
      bitbucketPrDestinationBranch: 'bitbucketPrDestinationBranch',
      bitbucketPrDestinationCommit: 'bitbucketPrDestinationCommit',
    })

    expectsCommitParams({
      sha: 'bitbucketCommit',
      branch: 'bitbucketBranch',
    })

    expectsCommitDefaults({
      sha: null,
      branch: 'gitFoundBranch',
    }, {
      sha: 'bitbucketCommit',
      branch: 'gitFoundBranch',
    })

    return expectsCommitDefaults({
      sha: undefined,
      branch: '',
    }, {
      sha: 'bitbucketCommit',
      branch: 'bitbucketBranch',
    })
  })

  it('buddy', () => {
    resetEnv = mockedEnv({
      BUDDY: 'true',
      BUDDY_RUN_ID: 'pull/1',
      BUDDY_RUN_PR_NO: '1',
      BUDDY_RUN_URL: 'https://app.buddy.works/my-workspace/my-project/pipelines/pipeline/1/execution/5d9dc42c422f5a268b389',
      BUDDY_RUN_BRANCH: 'feature-branch',
      BUDDY_RUN_COMMIT: '46c360492d6372e5335300776806af412755871',
      BUDDY_RUN_COMMIT_MESSAGE: 'commit message',
      BUDDY_RUN_COMMIT_COMMITTER_NAME: 'Committer Name',
      BUDDY_RUN_COMMIT_COMMITTER_EMAIL: 'committer@example.com',
      BUDDY_REPO_SSH_URL: 'git@github.com:githubaccount/repository',
    }, { clear: true })

    expectsName('buddy')
    expectsCiParams({
      buddyRunId: 'pull/1',
      buddyRunPrNo: '1',
      buddyRunUrl: 'https://app.buddy.works/my-workspace/my-project/pipelines/pipeline/1/execution/5d9dc42c422f5a268b389',
      buddyRunBranch: 'feature-branch',
      buddyRunCommit: '46c360492d6372e5335300776806af412755871',
      buddyRunCommitMessage: 'commit message',
      buddyRunCommitCommitterName: 'Committer Name',
      buddyRunCommitCommitterEmail: 'committer@example.com',
      buddyRepoSshUrl: 'git@github.com:githubaccount/repository',
    })

    return expectsCommitParams({
      sha: '46c360492d6372e5335300776806af412755871',
      branch: 'feature-branch',
      message: 'commit message',
      authorName: 'Committer Name',
      authorEmail: 'committer@example.com',
      remoteOrigin: 'git@github.com:githubaccount/repository',
    })
  })

  it('bitrise', () => {
    resetEnv = mockedEnv({
      BITRISE_IO: 'true',
      BITRISE_BUILD_NUMBER: '123',
      BITRISE_BUILD_URL: 'https://app.bitrise.io/build/abcd',
      BITRISE_BUILD_SLUG: 'abcd',
      BITRISE_APP_SLUG: 'appslug',
      GIT_REPOSITORY_URL: 'git@github.com:octocat/hello-world.git',
      BITRISE_GIT_BRANCH: 'main',
      BITRISEIO_GIT_BRANCH_DEST: 'main',
      BITRISE_PULL_REQUEST: '42',
      BITRISE_GIT_COMMIT: 'commitSha',
      BITRISE_GIT_MESSAGE: 'commit message',
      GIT_CLONE_COMMIT_AUTHOR_NAME: 'Author Name',
      GIT_CLONE_COMMIT_AUTHOR_EMAIL: 'author@example.com',
    }, { clear: true })

    expectsName('bitrise')
    expectsCiParams({
      bitriseBuildNumber: '123',
      bitriseBuildUrl: 'https://app.bitrise.io/build/abcd',
      bitriseBuildSlug: 'abcd',
      bitriseAppSlug: 'appslug',
      gitRepositoryUrl: 'git@github.com:octocat/hello-world.git',
      bitriseGitBranch: 'main',
      bitriseioGitBranchDest: 'main',
      bitrisePullRequest: '42',
    })

    return expectsCommitParams({
      sha: 'commitSha',
      branch: 'main',
      message: 'commit message',
      authorName: 'Author Name',
      authorEmail: 'author@example.com',
      remoteOrigin: 'git@github.com:octocat/hello-world.git',
    })
  })

  it('buildkite', () => {
    resetEnv = mockedEnv({
      BUILDKITE: 'true',

      BUILDKITE_REPO: 'buildkiteRepo',
      BUILDKITE_JOB_ID: 'buildkiteJobId',
      BUILDKITE_SOURCE: 'buildkiteSource',
      BUILDKITE_BUILD_ID: 'buildkiteBuildId',
      BUILDKITE_BUILD_URL: 'buildkiteBuildUrl',
      BUILDKITE_BUILD_NUMBER: 'buildkiteBuildNumber',
      BUILDKITE_PULL_REQUEST: 'buildkitePullRequest',
      BUILDKITE_PULL_REQUEST_REPO: 'buildkitePullRequestRepo',
      BUILDKITE_PULL_REQUEST_BASE_BRANCH: 'buildkitePullRequestBaseBranch',
      BUILDKITE_RETRY_COUNT: 'buildkiteRetryCount',

      BUILDKITE_COMMIT: 'buildKiteCommit',
      BUILDKITE_BRANCH: 'buildKiteBranch',
      BUILDKITE_MESSAGE: 'buildKiteMessage',
      BUILDKITE_BUILD_CREATOR: 'buildKiteBuildCreator',
      BUILDKITE_BUILD_CREATOR_EMAIL: 'buildKiteCreatorEmail',
      BUILDKITE_PIPELINE_DEFAULT_BRANCH: 'buildkitePipelineDefaultBranch',
    }, { clear: true })

    expectsName('buildkite')
    expectsCiParams({
      buildkiteRepo: 'buildkiteRepo',
      buildkiteJobId: 'buildkiteJobId',
      buildkiteRetryCount: 'buildkiteRetryCount',
      buildkiteSource: 'buildkiteSource',
      buildkiteBuildId: 'buildkiteBuildId',
      buildkiteBuildUrl: 'buildkiteBuildUrl',
      buildkiteBuildNumber: 'buildkiteBuildNumber',
      buildkitePullRequest: 'buildkitePullRequest',
      buildkitePullRequestRepo: 'buildkitePullRequestRepo',
      buildkitePullRequestBaseBranch: 'buildkitePullRequestBaseBranch',
    })

    expectsCommitParams({
      sha: 'buildKiteCommit',
      branch: 'buildKiteBranch',
      message: 'buildKiteMessage',
      authorName: 'buildKiteBuildCreator',
      authorEmail: 'buildKiteCreatorEmail',
      remoteOrigin: 'buildkiteRepo',
      defaultBranch: 'buildkitePipelineDefaultBranch',
    })

    // in this test only interested in branch and sha for example
    expectsCommitDefaults({
      sha: null,
      branch: 'gitFoundBranch',
    }, {
      sha: 'buildKiteCommit',
      branch: 'gitFoundBranch',
    })

    return expectsCommitDefaults({
      sha: undefined,
      branch: '',
    }, {
      sha: 'buildKiteCommit',
      branch: 'buildKiteBranch',
    })
  })

  it('circle', () => {
    resetEnv = mockedEnv({
      CIRCLECI: 'true',
      CIRCLE_JOB: 'circleJob',
      CIRCLE_BUILD_NUM: 'circleBuildNum',
      CIRCLE_BUILD_URL: 'circleBuildUrl',
      CIRCLE_PR_NUMBER: 'circlePrNumber',
      CIRCLE_PR_REPONAME: 'circlePrReponame',
      CIRCLE_PR_USERNAME: 'circlePrUsername',
      CIRCLE_COMPARE_URL: 'circleCompareUrl',
      CIRCLE_PIPELINE_ID: 'circlePipelineId',
      CIRCLE_WORKFLOW_ID: 'circleWorkflowId',
      CIRCLE_WORKFLOW_JOB_ID: 'circleWorkflowJobId',
      CIRCLE_PULL_REQUEST: 'circlePullRequest',
      CIRCLE_REPOSITORY_URL: 'circleRepositoryUrl',
      CI_PULL_REQUEST: 'ciPullRequest',

      CIRCLE_SHA1: 'circleSha',
      CIRCLE_BRANCH: 'circleBranch',
      CIRCLE_USERNAME: 'circleUsername',
    }, { clear: true })

    expectsName('circle')
    expectsCiParams({
      circleJob: 'circleJob',
      circleBuildNum: 'circleBuildNum',
      circleBuildUrl: 'circleBuildUrl',
      circlePrNumber: 'circlePrNumber',
      circlePrReponame: 'circlePrReponame',
      circlePrUsername: 'circlePrUsername',
      circleCompareUrl: 'circleCompareUrl',
      circlePipelineId: 'circlePipelineId',
      circleWorkflowId: 'circleWorkflowId',
      circleWorkflowJobId: 'circleWorkflowJobId',
      circlePullRequest: 'circlePullRequest',
      circleRepositoryUrl: 'circleRepositoryUrl',
      ciPullRequest: 'ciPullRequest',
    })

    return expectsCommitParams({
      sha: 'circleSha',
      branch: 'circleBranch',
      authorName: 'circleUsername',
    })
  })

  it('cloudbeesUnify', () => {
    resetEnv = mockedEnv({
      CLOUDBEES_WORKSPACE: '/cloudbees/workspace',
    }, { clear: true })

    expectsName('cloudbeesUnify')
    expectsCiParams({
      cloudbeesWorkspace: '/cloudbees/workspace',
    })

    return expectsCommitParams({})
  })

  it('concourse', () => {
    resetEnv = mockedEnv({
      CONCOURSE_WORK_DIR: '/opt/concourse/worker',

      BUILD_ID: 'ciBuildId',
    }, { clear: true })

    expectsName('concourse')
    expectsCiParams({
      buildId: 'ciBuildId',
    })

    return expectsCommitParams(null)
  })

  it('codeFresh', () => {
    resetEnv = mockedEnv({
      // build information
      'CF_BUILD_ID': 'cfBuildId',
      'CF_BUILD_URL': 'cfBuildUrl',
      'CF_CURRENT_ATTEMPT': 'cfCurrentAttempt',
      'CF_STEP_NAME': 'cfStepName',
      'CF_PIPELINE_NAME': 'cfPipelineName',
      'CF_PIPELINE_TRIGGER_ID': 'cfPipelineTriggerId',

      // variables added for pull requests
      'CF_PULL_REQUEST_ID': 'cfPullRequestId',
      'CF_PULL_REQUEST_IS_FORK': 'cfPullRequestIsFork',
      'CF_PULL_REQUEST_NUMBER': 'cfPullRequestNumber',
      'CF_PULL_REQUEST_TARGET': 'cfPullRequestTarget',

      // git information
      CF_REVISION: 'cfRevision',
      CF_BRANCH: 'cfBranch',
      CF_COMMIT_MESSAGE: 'cfCommitMessage',
      CF_COMMIT_AUTHOR: 'cfCommitAuthor',
    }, { clear: true })

    expectsName('codeFresh')
    expectsCiParams({
      cfBuildId: 'cfBuildId',
      cfBuildUrl: 'cfBuildUrl',
      cfCurrentAttempt: 'cfCurrentAttempt',
      cfStepName: 'cfStepName',
      cfPipelineName: 'cfPipelineName',
      cfPipelineTriggerId: 'cfPipelineTriggerId',
      // pull request variables
      cfPullRequestId: 'cfPullRequestId',
      cfPullRequestIsFork: 'cfPullRequestIsFork',
      cfPullRequestNumber: 'cfPullRequestNumber',
      cfPullRequestTarget: 'cfPullRequestTarget',
    })

    expectsCommitParams({
      sha: 'cfRevision',
      branch: 'cfBranch',
      message: 'cfCommitMessage',
      authorName: 'cfCommitAuthor',
    })
  })

  it('harness', () => {
    resetEnv = mockedEnv({
      // Ensure we detect Harness even if DRONE_* variables are present
      // (and without relying on DRONE=true marker)

      // Harness identifiers
      HARNESS_BUILD_ID: 'harnessBuildId',
      HARNESS_EXECUTION_ID: 'harnessExecutionId',
      HARNESS_PIPELINE_ID: 'harnessPipelineId',
      HARNESS_PROJECT_ID: 'harnessProjectId',
      HARNESS_ORG_ID: 'harnessOrgId',
      HARNESS_ACCOUNT_ID: 'harnessAccountId',
      HARNESS_STAGE_ID: 'harnessStageId',

      // Build metadata
      DRONE_BUILD_LINK: 'droneBuildLink',
      DRONE_BUILD_NUMBER: '42',
      DRONE_PULL_REQUEST: '13',
      DRONE_REPO: 'octocat/hello-world',

      // Commit metadata
      DRONE_COMMIT_SHA: 'droneCommitSha',
      DRONE_SOURCE_BRANCH: 'feature-branch',
      DRONE_COMMIT_MESSAGE: 'commit message',
      DRONE_COMMIT_AUTHOR: 'Drone Author',
      DRONE_COMMIT_AUTHOR_EMAIL: 'drone@author.test',
      DRONE_GIT_HTTP_URL: 'https://github.com/octocat/hello-world.git',
      DRONE_REPO_BRANCH: 'main',
    }, { clear: true })

    expectsName('harness')
    expectsCiParams({
      harnessBuildId: 'harnessBuildId',
      harnessExecutionId: 'harnessExecutionId',
      harnessPipelineId: 'harnessPipelineId',
      harnessProjectId: 'harnessProjectId',
      harnessOrgId: 'harnessOrgId',
      harnessAccountId: 'harnessAccountId',
      harnessStageId: 'harnessStageId',
      droneBuildLink: 'droneBuildLink',
      droneBuildNumber: '42',
      dronePullRequest: '13',
      droneRepo: 'octocat/hello-world',
    })

    return expectsCommitParams({
      sha: 'droneCommitSha',
      branch: 'feature-branch',
      message: 'commit message',
      authorName: 'Drone Author',
      authorEmail: 'drone@author.test',
      remoteOrigin: 'https://github.com/octocat/hello-world.git',
      defaultBranch: 'main',
    })
  })

  it('drone', () => {
    resetEnv = mockedEnv({
      DRONE_JOB_NUMBER: 'droneJobNumber',
      DRONE_BUILD_LINK: 'droneBuildLink',
      DRONE_BUILD_NUMBER: 'droneBuildNumber',
      DRONE_PULL_REQUEST: 'dronePullRequest',

      DRONE_COMMIT_SHA: 'droneCommitSha',
      DRONE_SOURCE_BRANCH: 'droneCommitBranch',
      DRONE_COMMIT_MESSAGE: 'droneCommitMessage',
      DRONE_COMMIT_AUTHOR: 'droneCommitAuthor',
      DRONE_COMMIT_AUTHOR_EMAIL: 'droneCommitAuthorEmail',
      DRONE_REPO_BRANCH: 'droneRepoBranch',
      DRONE_GIT_HTTP_URL: 'droneRemoteOrigin',
    }, { clear: true })

    expectsName('drone')
    expectsCiParams({
      droneJobNumber: 'droneJobNumber',
      droneBuildLink: 'droneBuildLink',
      droneBuildNumber: 'droneBuildNumber',
      dronePullRequest: 'dronePullRequest',
    })

    return expectsCommitParams({
      sha: 'droneCommitSha',
      branch: 'droneCommitBranch',
      message: 'droneCommitMessage',
      authorName: 'droneCommitAuthor',
      authorEmail: 'droneCommitAuthorEmail',
      defaultBranch: 'droneRepoBranch',
      remoteOrigin: 'droneRemoteOrigin',
    })
  })

  it('github actions', () => {
    // with GH_BRANCH used as branch
    resetEnv = mockedEnv({
      GITHUB_ACTIONS: 'true',
      GITHUB_WORKFLOW: 'ciGitHubWorkflowName',
      GITHUB_ACTION: 'ciGitHubActionId',
      GITHUB_EVENT_NAME: 'ciEventName',
      GITHUB_RUN_ID: 'ciGithubRunId',
      GITHUB_JOB: 'jobName',
      GITHUB_RUN_ATTEMPT: 'ciGithubRunAttempt',
      GITHUB_REPOSITORY: 'ciGithubRepository',
      GITHUB_SHA: 'ciCommitSha',
      GH_BRANCH: 'GHCommitBranch',
      GITHUB_REF: 'ciCommitRef',
      GITHUB_HEAD_REF: 'ciHeadRef',
      GITHUB_BASE_REF: 'ciBaseRef',
      GITHUB_REF_NAME: 'ciRefName',
    }, { clear: true })

    expectsName('githubActions')
    expectsCiParams({
      githubAction: 'ciGitHubActionId',
      githubEventName: 'ciEventName',
      githubWorkflow: 'ciGitHubWorkflowName',
      githubRepository: 'ciGithubRepository',
      githubRunAttempt: 'ciGithubRunAttempt',
      githubRunId: 'ciGithubRunId',
      githubJob: 'jobName',
      githubBaseRef: 'ciBaseRef',
      githubHeadRef: 'ciHeadRef',
      githubRefName: 'ciRefName',
      githubRef: 'ciCommitRef',
    })

    expectsCommitParams({
      sha: 'ciCommitSha',
      defaultBranch: 'ciBaseRef',
      runAttempt: 'ciGithubRunAttempt',
      remoteBranch: 'ciHeadRef',
      branch: 'GHCommitBranch',
    })

    // with GITHUB_HEAD_REF used as branch
    resetEnv = mockedEnv({
      GITHUB_ACTIONS: 'true',
      GH_BRANCH: undefined,
      GITHUB_HEAD_REF: 'ciHeadRef',
      GITHUB_REF_NAME: 'ciRefName',
      GITHUB_REF: 'ciCommitRef',
    }, { clear: true })

    expectsCommitParams({
      branch: 'ciHeadRef',
      remoteBranch: 'ciHeadRef',
    })

    // with GITHUB_REF_NAME used as branch
    resetEnv = mockedEnv({
      GITHUB_ACTIONS: 'true',
      GH_BRANCH: undefined,
      GITHUB_HEAD_REF: undefined,
      GITHUB_REF_NAME: 'ciRefName',
      GITHUB_REF: 'ciCommitRef',
    }, { clear: true })

    return expectsCommitParams({
      branch: 'ciRefName',
    })
  })

  it('gitlab', () => {
    resetEnv = mockedEnv({
      GITLAB_CI: 'true',

      // Gitlab has job id and build id as synonyms
      CI_BUILD_ID: 'ciJobId',
      CI_JOB_ID: 'ciJobId',
      CI_JOB_URL: 'ciJobUrl',
      CI_JOB_NAME: 'ciJobName',

      CI_PIPELINE_ID: 'ciPipelineId',
      CI_PIPELINE_URL: 'ciPipelineUrl',

      GITLAB_HOST: 'gitlabHost',
      CI_PROJECT_ID: 'ciProjectId',
      CI_PROJECT_URL: 'ciProjectUrl',
      CI_REPOSITORY_URL: 'ciRepositoryUrl',
      CI_ENVIRONMENT_URL: 'ciEnvironmentUrl',
      CI_DEFAULT_BRANCH: 'ciDefaultBranch',

      CI_COMMIT_SHA: 'ciCommitSha',
      CI_COMMIT_REF_NAME: 'ciCommitRefName',
      CI_COMMIT_MESSAGE: 'ciCommitMessage',
      GITLAB_USER_NAME: 'gitlabUserName',
      GITLAB_USER_EMAIL: 'gitlabUserEmail',
      CI_MERGE_REQUEST_SOURCE_BRANCH_NAME: 'sourceBranchName',
      CI_MERGE_REQUEST_SOURCE_BRANCH_SHA: 'sourceBranchSha',
    }, { clear: true })

    expectsName('gitlab')
    expectsCiParams({
      ciJobId: 'ciJobId',
      ciJobUrl: 'ciJobUrl',
      ciJobName: 'ciJobName',
      ciBuildId: 'ciJobId',
      ciPipelineId: 'ciPipelineId',
      ciPipelineUrl: 'ciPipelineUrl',
      gitlabHost: 'gitlabHost',
      ciProjectId: 'ciProjectId',
      ciProjectUrl: 'ciProjectUrl',
      ciRepositoryUrl: 'ciRepositoryUrl',
      ciEnvironmentUrl: 'ciEnvironmentUrl',
      ciDefaultBranch: 'ciDefaultBranch',
      ciMergeRequestSourceBranchName: 'sourceBranchName',
      ciMergeRequestSourceBranchSha: 'sourceBranchSha',
    })

    expectsCommitParams({
      sha: 'ciCommitSha',
      branch: 'ciCommitRefName',
      message: 'ciCommitMessage',
      authorName: 'gitlabUserName',
      authorEmail: 'gitlabUserEmail',
      remoteOrigin: 'ciRepositoryUrl',
      defaultBranch: 'ciDefaultBranch',
    })

    resetEnv = mockedEnv({
      CI_SERVER_NAME: 'GitLab CI',
    }, { clear: true })

    expectsName('gitlab')

    resetEnv = mockedEnv({
      CI_SERVER_NAME: 'GitLab',
    }, { clear: true })

    return expectsName('gitlab')
  })

  it('goCD', () => {
    resetEnv = mockedEnv({
      GO_SERVER_URL: 'https://127.0.0.1:8154/go',
      GO_ENVIRONMENT_NAME: 'Development',
      GO_PIPELINE_NAME: 'main',
      GO_PIPELINE_COUNTER: '2345',
      GO_PIPELINE_LABEL: '1.1.2345',
      GO_STAGE_NAME: 'dev',
      GO_STAGE_COUNTER: '1',
      GO_JOB_NAME: 'linux-firefox',
      GO_TRIGGER_USER: 'changes',
      GO_REVISION: '123',
      GO_TO_REVISION: '123',
      GO_FROM_REVISION: '121',
      GO_MATERIAL_HAS_CHANGED: 'true',
    }, { clear: true })

    expectsName('goCD')
    expectsCiParams({
      goServerUrl: 'https://127.0.0.1:8154/go',
      goEnvironmentName: 'Development',
      goPipelineName: 'main',
      goPipelineCounter: '2345',
      goPipelineLabel: '1.1.2345',
      goStageName: 'dev',
      goStageCounter: '1',
      goJobName: 'linux-firefox',
      goTriggerUser: 'changes',
      goRevision: '123',
      goToRevision: '123',
      goFromRevision: '121',
      goMaterialHasChanged: 'true',
    })

    return expectsCommitParams(null)
  })

  it('google cloud', () => {
    resetEnv = mockedEnv({
      GCP_PROJECT: '123',

      BUILD_ID: 'buildId',

      PROJECT_ID: 'projectId',

      COMMIT_SHA: 'commitSha',
      BRANCH_NAME: 'branchName',
      _HEAD_BRANCH: 'headBranch',
      _BASE_BRANCH: 'baseBranch',
      _PR_NUMBER: 'prNumber',
    }, { clear: true })

    expectsName('googleCloud')
    expectsCiParams({
      buildId: 'buildId',
      projectId: 'projectId',
      commitSha: 'commitSha',
      branchName: 'branchName',
      headBranch: 'headBranch',
      baseBranch: 'baseBranch',
      prNumber: 'prNumber',
    })

    expectsCommitParams({
      sha: 'commitSha',
      branch: 'branchName',
    })

    resetEnv = mockedEnv({
      GCLOUD_PROJECT: '123',
    }, { clear: true })

    expectsName('googleCloud')

    resetEnv = mockedEnv({
      GOOGLE_CLOUD_PROJECT: '123',
    }, { clear: true })

    return expectsName('googleCloud')
  })

  describe('jenkins', () => {
    it('with legacy env', () => {
      resetEnv = mockedEnv({
        JENKINS_URL: 'true',

        BUILD_ID: 'buildId',
        BUILD_URL: 'buildUrl',
        BUILD_NUMBER: 'buildNumber',
        ghprbPullId: 'gbprbPullId',

        GIT_COMMIT: 'gitCommit',
        GIT_BRANCH: 'gitBranch',
        GIT_AUTHOR_NAME: 'gitAuthorName',
        GIT_AUTHOR_EMAIL: 'gitAuthorEmail',
      }, { clear: true })

      expectsName('jenkins')
      expectsCiParams({
        buildId: 'buildId',
        buildUrl: 'buildUrl',
        buildNumber: 'buildNumber',
        ghprbPullId: 'gbprbPullId',
      })

      expectsCommitParams({
        sha: 'gitCommit',
        branch: 'gitBranch',
        authorName: 'gitAuthorName',
        authorEmail: 'gitAuthorEmail',
      })

      resetEnv = mockedEnv({
        JENKINS_HOME: '/path/to/jenkins',
      }, { clear: true })

      expectsName('jenkins')

      resetEnv = mockedEnv({
        JENKINS_VERSION: '1.2.3',
      }, { clear: true })

      expectsName('jenkins')

      resetEnv = mockedEnv({
        HUDSON_HOME: '/path/to/jenkins',
      }, { clear: true })

      expectsName('jenkins')

      resetEnv = mockedEnv({
        HUDSON_URL: 'true',
      }, { clear: true })

      return expectsName('jenkins')
    })

    it('with change request params (PR Scenario)', () => {
      resetEnv = mockedEnv({
        JENKINS_URL: 'true',

        BUILD_ID: 'buildId',
        BUILD_NUMBER: 'buildNumber',
        CHANGE_BRANCH: 'changeBranch',
        CYPRESS_CI_BUILD_URL: 'cypressCiBuildUrl',

        GIT_COMMIT: 'gitCommit',
        CHANGE_ID: 'changeId',
        CHANGE_URL: 'changeUrl',
        CHANGE_TITLE: 'changeTitle',
        CHANGE_TARGET: 'changeTarget',
        CHANGE_AUTHOR_DISPLAY_NAME: 'changeAuthorDisplayName',
        CHANGE_AUTHOR_EMAIL: 'changeAuthorEmail',
      }, { clear: true })

      expectsName('jenkins')
      expectsCiParams({
        buildId: 'buildId',
        buildNumber: 'buildNumber',
        cypressCiBuildUrl: 'cypressCiBuildUrl',
        changeId: 'changeId',
        changeTitle: 'changeTitle',
        changeUrl: 'changeUrl',
        changeTarget: 'changeTarget',
      })

      return expectsCommitParams({
        sha: 'gitCommit',
        branch: 'changeBranch',
        authorName: 'changeAuthorDisplayName',
        authorEmail: 'changeAuthorEmail',
      })
    })

    it('with userProvided', () => {
      resetEnv = mockedEnv({
        JENKINS_URL: 'true',

        BUILD_ID: 'buildId',
        BUILD_NUMBER: 'buildNumber',
        CYPRESS_PULL_REQUEST_ID: 'cypressPullRequestId',
        CYPRESS_PULL_REQUEST_URL: 'cypressPullRequestUrl',
        CYPRESS_CI_BUILD_URL: 'cypressCiBuildUrl',

        GIT_COMMIT: 'gitCommit',
        GIT_BRANCH: 'gitBranch',
      }, { clear: true })

      expectsName('jenkins')
      expectsCiParams({
        buildId: 'buildId',
        buildNumber: 'buildNumber',
        cypressPullRequestId: 'cypressPullRequestId',
        cypressPullRequestUrl: 'cypressPullRequestUrl',
        cypressCiBuildUrl: 'cypressCiBuildUrl',
      })

      return expectsCommitParams({
        sha: 'gitCommit',
        branch: 'gitBranch',
      })
    })
  })

  it('semaphore', () => {
    resetEnv = mockedEnv({
      SEMAPHORE: 'true',

      SEMAPHORE_BRANCH_ID: 'semaphoreBranchId',
      SEMAPHORE_BUILD_NUMBER: 'semaphoreBuildNumber',
      SEMAPHORE_CURRENT_JOB: 'semaphoreCurrentJob',
      SEMAPHORE_CURRENT_THREAD: 'semaphoreCurrentThread',
      SEMAPHORE_EXECUTABLE_UUID: 'semaphoreExecutableUuid',
      SEMAPHORE_GIT_BRANCH: 'show-semaphore-v2-266',
      SEMAPHORE_GIT_WORKING_BRANCH: 'show-semaphore-v2-266',
      SEMAPHORE_GIT_COMMIT_AUTHOR: 'semaphoreGitCommitAuthor',
      SEMAPHORE_GIT_DIR: 'cypress-example-kitchensink',
      SEMAPHORE_GIT_PR_NUMBER: '1',
      SEMAPHORE_GIT_REF: 'refs/heads/show-semaphore-v2-266',
      SEMAPHORE_GIT_REF_TYPE: 'branch',
      SEMAPHORE_GIT_REPO_SLUG: 'cypress-io/cypress-example-kitchensink',
      SEMAPHORE_GIT_SHA: '83ce1df0f8be2767655bb805d20126ee441b71bf',
      SEMAPHORE_GIT_URL: 'git@github.com:cypress-io/cypress-example-kitchensink.git',
      SEMAPHORE_JOB_ID: '5fb8dd98-3242-4a4e-a8ab-c4eca9db486c',
      SEMAPHORE_JOB_NAME: 'Cypress E2E 2',
      SEMAPHORE_JOB_COUNT: 'semaphoreJobCount',
      SEMAPHORE_JOB_INDEX: '2',
      SEMAPHORE_JOB_UUID: 'semaphoreJobUuid',
      SEMAPHORE_ORGANIZATION_URL: 'https://my-org.semaphoreci.com',
      SEMAPHORE_PIPELINE_ID: 'a9219129-951e-4e2c-9354-45534b63fa8b',
      SEMAPHORE_PLATFORM: 'semaphorePlatform',
      SEMAPHORE_PROJECT_DIR: 'semaphoreProjectDir',
      SEMAPHORE_PROJECT_HASH_ID: 'semaphoreProjectHashId',
      SEMAPHORE_PROJECT_ID: 'b717c4cc-fa0e-46f8-8bbf-589ab49a1777',
      SEMAPHORE_PROJECT_NAME: 'cypress-example-kitchensink',
      SEMAPHORE_PROJECT_UUID: 'semaphoreProjectUuid',
      SEMAPHORE_REPO_SLUG: 'semaphoreRepoSlug',
      SEMAPHORE_TRIGGER_SOURCE: 'semaphoreTriggerSource',
      SEMAPHORE_WORKFLOW_ID: '67aecea7-e4e7-405e-a77c-165e1b37a128',
      SEMAPHORE_WORKFLOW_NUMBER: '42',
      PULL_REQUEST_NUMBER: 'pullRequestNumber',
    }, { clear: true })

    expectsName('semaphore')
    expectsCiParams({
      pullRequestNumber: 'pullRequestNumber',
      semaphoreBranchId: 'semaphoreBranchId',
      semaphoreBuildNumber: 'semaphoreBuildNumber',
      semaphoreCurrentJob: 'semaphoreCurrentJob',
      semaphoreCurrentThread: 'semaphoreCurrentThread',
      semaphoreExecutableUuid: 'semaphoreExecutableUuid',
      semaphoreGitBranch: 'show-semaphore-v2-266',
      semaphoreGitWorkingBranch: 'show-semaphore-v2-266',
      semaphoreGitCommitAuthor: 'semaphoreGitCommitAuthor',
      semaphoreGitDir: 'cypress-example-kitchensink',
      semaphoreGitPrNumber: '1',
      semaphoreGitRef: 'refs/heads/show-semaphore-v2-266',
      semaphoreGitRefType: 'branch',
      semaphoreGitRepoSlug: 'cypress-io/cypress-example-kitchensink',
      semaphoreGitSha: '83ce1df0f8be2767655bb805d20126ee441b71bf',
      semaphoreGitUrl: 'git@github.com:cypress-io/cypress-example-kitchensink.git',
      semaphoreJobId: '5fb8dd98-3242-4a4e-a8ab-c4eca9db486c',
      semaphoreJobName: 'Cypress E2E 2',
      semaphoreJobCount: 'semaphoreJobCount',
      semaphoreJobIndex: '2',
      semaphoreJobUuid: 'semaphoreJobUuid',
      semaphoreOrganizationUrl: 'https://my-org.semaphoreci.com',
      semaphorePipelineId: 'a9219129-951e-4e2c-9354-45534b63fa8b',
      semaphorePlatform: 'semaphorePlatform',
      semaphoreProjectDir: 'semaphoreProjectDir',
      semaphoreProjectHashId: 'semaphoreProjectHashId',
      semaphoreProjectId: 'b717c4cc-fa0e-46f8-8bbf-589ab49a1777',
      semaphoreProjectName: 'cypress-example-kitchensink',
      semaphoreProjectUuid: 'semaphoreProjectUuid',
      semaphoreRepoSlug: 'semaphoreRepoSlug',
      semaphoreTriggerSource: 'semaphoreTriggerSource',
      semaphoreWorkflowId: '67aecea7-e4e7-405e-a77c-165e1b37a128',
      semaphoreWorkflowNumber: '42',
    })

    return expectsCommitParams({
      sha: '83ce1df0f8be2767655bb805d20126ee441b71bf',
      branch: 'show-semaphore-v2-266',
      authorName: 'semaphoreGitCommitAuthor',
      remoteOrigin: 'git@github.com:cypress-io/cypress-example-kitchensink.git',
    })
  })

  it('teamcity', () => {
    resetEnv = mockedEnv({
      TEAMCITY_VERSION: '2025.12',
      BUILD_NUMBER: '42',
      BUILD_URL: 'https://teamcity.example.com/viewLog.html?buildId=42&buildTypeId=bt1',
    }, { clear: true })

    expectsName('teamcity')
    expectsCiParams({
      buildNumber: '42',
      buildUrl: 'https://teamcity.example.com/viewLog.html?buildId=42&buildTypeId=bt1',
    })

    return expectsCommitParams(null)
  })

  it('netlify', () => {
    resetEnv = mockedEnv({
      NETLIFY: 'true',

      BUILD_ID: 'buildId',
      CONTEXT: 'deployContent',
      // deploy env variables
      URL: 'url',
      DEPLOY_URL: 'individualDeployUrl',
      DEPLOY_PRIME_URL: 'primeDeployUrl',
      DEPLOY_ID: 'deployId',

      COMMIT_REF: 'commit',
      BRANCH: 'branch',
      HEAD: 'head',
      CACHED_COMMIT_REF: 'previousCommit',
      PULL_REQUEST: 'pullRequestTrueOrFalse',
      REVIEW_ID: 'pullRequestReviewId',
      REPOSITORY_URL: 'repositoryUrl',
    }, { clear: true })

    expectsName('netlify')
    expectsCiParams({
      buildId: 'buildId',
      context: 'deployContent',
      url: 'url',
      deployUrl: 'individualDeployUrl',
      deployPrimeUrl: 'primeDeployUrl',
      deployId: 'deployId',
    })

    return expectsCommitParams({
      sha: 'commit',
      branch: 'branch',
      remoteOrigin: 'repositoryUrl',
    })
  })

  it('azure', () => {
    resetEnv = mockedEnv({
      // these two variables tell us it is Azure CI
      TF_BUILD: 'true',
      AZURE_HTTP_USER_AGENT: 'VSTS_5e0090d5-c5b9-4fab-8fd8-ce288e9fb666_build_2_0',

      BUILD_BUILDID: 'buildId',
      BUILD_BUILDNUMBER: 'buildNumber',
      BUILD_CONTAINERID: 'containerId',
      BUILD_REPOSITORY_URI: 'buildRepositoryUri',
      SYSTEM_PLANID: 'planId',
      SYSTEM_PULLREQUEST_PULLREQUESTNUMBER: 'systemPullrequestPullrequestnumber',
      SYSTEM_PULLREQUEST_TARGETBRANCH: 'targetBranch',
      SYSTEM_PULLREQUEST_TARGETBRANCHNAME: 'targetBranchName',
      SYSTEM_JOBID: 'jobid',
      SYSTEM_STAGEATTEMPT: 'stageAttempt',
      SYSTEM_PHASEATTEMPT: 'phaseAttempt',
      SYSTEM_JOBATTEMPT: 'jobAttempt',

      BUILD_SOURCEVERSION: 'commit',
      BUILD_SOURCEBRANCHNAME: 'branch',
      BUILD_SOURCEVERSIONMESSAGE: 'message',
      BUILD_SOURCEVERSIONAUTHOR: 'name',
      BUILD_REQUESTEDFOREMAIL: 'email',
    }, { clear: true })

    expectsName('azure')
    expectsCiParams({
      buildBuildid: 'buildId',
      buildBuildnumber: 'buildNumber',
      buildContainerid: 'containerId',
      buildRepositoryUri: 'buildRepositoryUri',
      systemPlanid: 'planId',
      systemPullrequestPullrequestnumber: 'systemPullrequestPullrequestnumber',
      systemPullrequestTargetbranch: 'targetBranch',
      systemPullrequestTargetbranchname: 'targetBranchName',
      systemJobid: 'jobid',
      systemStageattempt: 'stageAttempt',
      systemPhaseattempt: 'phaseAttempt',
      systemJobattempt: 'jobAttempt',
    })

    return expectsCommitParams({
      sha: 'commit',
      branch: 'branch',
      message: 'message',
      authorName: 'name',
      authorEmail: 'email',
    })
  })

  it('travis', () => {
    // normal non-PR build
    resetEnv = mockedEnv({
      TRAVIS: 'true',

      TRAVIS_JOB_ID: 'travisJobId',
      TRAVIS_BUILD_ID: 'travisBuildId',
      TRAVIS_BUILD_WEB_URL: 'https://travis-ci.org/github/project/123',
      TRAVIS_REPO_SLUG: 'travisRepoSlug',
      TRAVIS_JOB_NUMBER: 'travisJobNumber',
      TRAVIS_EVENT_TYPE: 'travisEventType',
      TRAVIS_COMMIT_RANGE: 'travisCommitRange',
      TRAVIS_BUILD_NUMBER: 'travisBuildNumber',
      TRAVIS_PULL_REQUEST: '',
      TRAVIS_PULL_REQUEST_BRANCH: '',
      TRAVIS_PULL_REQUEST_SHA: '',

      TRAVIS_COMMIT: 'travisCommit',
      TRAVIS_BRANCH: 'travisBranch',
      TRAVIS_COMMIT_MESSAGE: 'travisCommitMessage',
    }, { clear: true })

    expectsName('travis')
    expectsCiParams({
      travisJobId: 'travisJobId',
      travisBuildId: 'travisBuildId',
      travisBuildWebUrl: 'https://travis-ci.org/github/project/123',
      travisRepoSlug: 'travisRepoSlug',
      travisJobNumber: 'travisJobNumber',
      travisEventType: 'travisEventType',
      travisCommitRange: 'travisCommitRange',
      travisBuildNumber: 'travisBuildNumber',
      travisPullRequest: '',
      travisPullRequestBranch: '',
      travisPullRequestSha: '',
    })

    expectsCommitParams({
      sha: 'travisCommit',
      branch: 'travisBranch',
      message: 'travisCommitMessage',
    })

    resetEnv = mockedEnv({
      TRAVIS: 'true',
      TRAVIS_BRANCH: 'travisBranch',
    }, { clear: true })

    expectsCommitParams({
      branch: 'travisBranch',
    })

    // Pull Request build
    resetEnv = mockedEnv({
      TRAVIS: 'true',
      TRAVIS_PULL_REQUEST: 'travisPullRequest',
      TRAVIS_PULL_REQUEST_BRANCH: 'travisPullRequestBranch',
      TRAVIS_PULL_REQUEST_SHA: 'travisPullRequestSha',

      TRAVIS_COMMIT: 'travisCommit',
      TRAVIS_BRANCH: 'travisBranch',
      TRAVIS_COMMIT_MESSAGE: 'travisCommitMessage',
    }, { clear: true })

    return expectsCommitParams({
      sha: 'travisPullRequestSha',
      branch: 'travisPullRequestBranch',
      message: 'travisCommitMessage',
    })
  })
})
