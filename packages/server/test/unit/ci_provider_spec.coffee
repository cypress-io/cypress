R = require("ramda")
mockedEnv = require("mocked-env")
require("../spec_helper")

ciProvider = require("#{root}lib/util/ci_provider")

expectsName = (name) ->
  expect(ciProvider.provider(), "CI providers detected name").to.eq(name)

expectsCiParams = (params) ->
  expect(ciProvider.ciParams(), "CI providers detected CI params").to.deep.eq(params)

expectsCommitParams = (params) ->
  expect(ciProvider.commitParams(), "CI providers detected commit params").to.deep.eq(params)

expectsCommitDefaults = (existing, expected) ->
  expect(ciProvider.commitDefaults(existing), "CI providers default git params").to.deep.eq(expected)

describe "lib/util/ci_provider", ->
  resetEnv = null

  beforeEach ->
    resetEnv?()

  afterEach ->
    resetEnv?()

  it "null when unknown", ->
    resetEnv = mockedEnv({}, {clear: true})

    expectsName(null)
    expectsCiParams(null)
    expectsCommitParams(null)

  it "appveyor", ->
    resetEnv = mockedEnv({
      APPVEYOR: "true"

      APPVEYOR_JOB_ID: "appveyorJobId2"
      APPVEYOR_ACCOUNT_NAME: "appveyorAccountName"
      APPVEYOR_PROJECT_SLUG: "appveyorProjectSlug"
      APPVEYOR_BUILD_VERSION: "appveyorBuildVersion"
      APPVEYOR_BUILD_NUMBER: "appveyorBuildNumber"
      APPVEYOR_PULL_REQUEST_NUMBER: "appveyorPullRequestNumber"
      APPVEYOR_PULL_REQUEST_HEAD_REPO_BRANCH: "appveyorPullRequestHeadRepoBranch"

      APPVEYOR_REPO_COMMIT: "repoCommit"
      APPVEYOR_REPO_COMMIT_MESSAGE: "repoCommitMessage"
      APPVEYOR_REPO_BRANCH: "repoBranch"
      APPVEYOR_REPO_COMMIT_AUTHOR: "repoCommitAuthor"
      APPVEYOR_REPO_COMMIT_AUTHOR_EMAIL: "repoCommitAuthorEmail"
    }, {clear: true})

    expectsName("appveyor")
    expectsCiParams({
      appveyorJobId: "appveyorJobId2"
      appveyorAccountName: "appveyorAccountName"
      appveyorProjectSlug: "appveyorProjectSlug"
      appveyorBuildNumber: "appveyorBuildNumber"
      appveyorBuildVersion: "appveyorBuildVersion"
      appveyorPullRequestNumber: "appveyorPullRequestNumber"
      appveyorPullRequestHeadRepoBranch: "appveyorPullRequestHeadRepoBranch"
    })
    expectsCommitParams({
      sha: "repoCommit"
      branch: "repoBranch"
      message: "repoCommitMessage"
      authorName: "repoCommitAuthor"
      authorEmail: "repoCommitAuthorEmail"
    })

    resetEnv()

    resetEnv = mockedEnv({
      APPVEYOR: "true"
      APPVEYOR_REPO_COMMIT_MESSAGE: "repoCommitMessage"
      APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED: "repoCommitMessageExtended"
    }, {clear: true})

    expectsCommitParams({
      message: "repoCommitMessage\nrepoCommitMessageExtended"
    })

  it "bamboo", ->
    resetEnv = mockedEnv({
      "bamboo.buildNumber": "123"

      "bamboo.resultsUrl": "bamboo.resultsUrl"
      "bamboo.buildResultsUrl": "bamboo.buildResultsUrl"
      "bamboo.planRepository.repositoryUrl": "bamboo.planRepository.repositoryUrl"

      "bamboo.planRepository.branch": "bamboo.planRepository.branch"
    }, {clear: true})

    expectsName("bamboo")
    expectsCiParams({
      bambooResultsUrl: "bamboo.resultsUrl"
      bambooBuildNumber: "123"
      bambooBuildResultsUrl: "bamboo.buildResultsUrl"
      bambooPlanRepositoryRepositoryUrl: "bamboo.planRepository.repositoryUrl"
    })
    expectsCommitParams({
      branch: "bamboo.planRepository.branch"
    })

  it "bitbucket", ->
    resetEnv = mockedEnv({
      CI: "1"

      # build information
      BITBUCKET_BUILD_NUMBER: "bitbucketBuildNumber"
      BITBUCKET_REPO_OWNER: "bitbucketRepoOwner"
      BITBUCKET_REPO_SLUG: "bitbucketRepoSlug"

      # git information
      BITBUCKET_COMMIT: "bitbucketCommit"
      BITBUCKET_BRANCH: "bitbucketBranch"
    }, {clear: true})

    expectsName("bitbucket")
    expectsCiParams({
      bitbucketBuildNumber: "bitbucketBuildNumber"
      bitbucketRepoOwner: "bitbucketRepoOwner"
      bitbucketRepoSlug: "bitbucketRepoSlug"
    })
    expectsCommitParams({
      sha: "bitbucketCommit"
      branch: "bitbucketBranch"
    })
    expectsCommitDefaults({
      sha: null
      branch: "gitFoundBranch"
    }, {
      sha: "bitbucketCommit"
      branch: "gitFoundBranch"
    })

  it "buildkite", ->
    resetEnv = mockedEnv({
      BUILDKITE: "true"

      BUILDKITE_REPO: "buildkiteRepo"
      BUILDKITE_JOB_ID: "buildkiteJobId"
      BUILDKITE_SOURCE: "buildkiteSource"
      BUILDKITE_BUILD_ID: "buildkiteBuildId"
      BUILDKITE_BUILD_URL: "buildkiteBuildUrl"
      BUILDKITE_BUILD_NUMBER: "buildkiteBuildNumber"
      BUILDKITE_PULL_REQUEST: "buildkitePullRequest"
      BUILDKITE_PULL_REQUEST_REPO: "buildkitePullRequestRepo"
      BUILDKITE_PULL_REQUEST_BASE_BRANCH: "buildkitePullRequestBaseBranch"

      BUILDKITE_COMMIT: "buildKiteCommit"
      BUILDKITE_BRANCH: "buildKiteBranch"
      BUILDKITE_MESSAGE: "buildKiteMessage"
      BUILDKITE_BUILD_CREATOR: "buildKiteBuildCreator"
      BUILDKITE_BUILD_CREATOR_EMAIL: "buildKiteCreatorEmail"
      BUILDKITE_REPO: "buildkiteRepo"
      BUILDKITE_PIPELINE_DEFAULT_BRANCH: "buildkitePipelineDefaultBranch"
    }, {clear: true})

    expectsName("buildkite")
    expectsCiParams({
      buildkiteRepo: "buildkiteRepo"
      buildkiteJobId: "buildkiteJobId"
      buildkiteSource: "buildkiteSource"
      buildkiteBuildId: "buildkiteBuildId"
      buildkiteBuildUrl: "buildkiteBuildUrl"
      buildkiteBuildNumber: "buildkiteBuildNumber"
      buildkitePullRequest: "buildkitePullRequest"
      buildkitePullRequestRepo: "buildkitePullRequestRepo"
      buildkitePullRequestBaseBranch: "buildkitePullRequestBaseBranch"
    })
    expectsCommitParams({
      sha: "buildKiteCommit"
      branch: "buildKiteBranch"
      message: "buildKiteMessage"
      authorName: "buildKiteBuildCreator"
      authorEmail: "buildKiteCreatorEmail"
      remoteOrigin: "buildkiteRepo"
      defaultBranch: "buildkitePipelineDefaultBranch"
    })

  it "circle", ->
    resetEnv = mockedEnv({
      CIRCLECI: "true"

      CIRCLE_JOB: "circleJob"
      CIRCLE_BUILD_NUM: "circleBuildNum"
      CIRCLE_BUILD_URL: "circleBuildUrl"
      CIRCLE_PR_NUMBER: "circlePrNumber"
      CIRCLE_PR_REPONAME: "circlePrReponame"
      CIRCLE_PR_USERNAME: "circlePrUsername"
      CIRCLE_COMPARE_URL: "circleCompareUrl"
      CIRCLE_WORKFLOW_ID: "circleWorkflowId"
      CIRCLE_PULL_REQUEST: "circlePullRequest"
      CIRCLE_REPOSITORY_URL: "circleRepositoryUrl"
      CI_PULL_REQUEST: "ciPullRequest"

      CIRCLE_SHA1: "circleSha"
      CIRCLE_BRANCH: "circleBranch"
      CIRCLE_USERNAME: "circleUsername"
    }, {clear: true})

    expectsName("circle")
    expectsCiParams({
      circleJob: "circleJob"
      circleBuildNum: "circleBuildNum"
      circleBuildUrl: "circleBuildUrl"
      circlePrNumber: "circlePrNumber"
      circlePrReponame: "circlePrReponame"
      circlePrUsername: "circlePrUsername"
      circleCompareUrl: "circleCompareUrl"
      circleWorkflowId: "circleWorkflowId"
      circlePullRequest: "circlePullRequest"
      circleRepositoryUrl: "circleRepositoryUrl"
      ciPullRequest: "ciPullRequest"
    })
    expectsCommitParams({
      sha: "circleSha"
      branch: "circleBranch"
      authorName: "circleUsername"
    })

  it.only "codeshipBasic", ->
    resetEnv = mockedEnv({
      CODESHIP: "TRUE"
      CI_NAME: "codeship"

      CI_BUILD_ID: "ciBuildId"
      CI_REPO_NAME: "ciRepoName"
      CI_BUILD_URL: "ciBuildUrl"
      CI_PROJECT_ID: "ciProjectId"
      CI_BUILD_NUMBER: "ciBuildNumber"
      CI_PULL_REQUEST: "ciPullRequest"

      CI_COMMIT_ID: "ciCommitId"
      CI_BRANCH: "ciBranch"
      CI_COMMIT_MESSAGE: "ciCommitMessage"
      CI_COMMITTER_NAME: "ciCommitterName"
      CI_COMMITTER_EMAIL: "ciCommitterEmail"
    }, {clear: true})

    expectsName("codeshipBasic")
    expectsCiParams({
      ciBuildId: "ciBuildId"
      ciRepoName: "ciRepoName"
      ciBuildUrl: "ciBuildUrl"
      ciProjectId: "ciProjectId"
      ciBuildNumber: "ciBuildNumber"
      ciPullRequest: "ciPullRequest"
    })
    expectsCommitParams({
      sha: "ciCommitId"
      branch: "ciBranch"
      message: "ciCommitMessage"
      authorName: "ciCommitterName"
      authorEmail: "ciCommitterEmail"
    })

  it "codeshipPro", ->
    resetEnv = mockedEnv({
      CI_NAME: "codeship"

      CI_BUILD_ID: "ciBuildId"
      CI_REPO_NAME: "ciRepoName"
      CI_PROJECT_ID: "ciProjectId"

      CI_COMMIT_ID: "ciCommitId"
      CI_BRANCH: "ciBranch"
      CI_COMMIT_MESSAGE: "ciCommitMessage"
      CI_COMMITTER_NAME: "ciCommitterName"
      CI_COMMITTER_EMAIL: "ciCommitterEmail"
    }, {clear: true})

    expectsName("codeshipPro")
    expectsCiParams({
      ciBuildId: "ciBuildId"
      ciRepoName: "ciRepoName"
      ciProjectId: "ciProjectId"
    })
    expectsCommitParams({
      sha: "ciCommitId"
      branch: "ciBranch"
      message: "ciCommitMessage"
      authorName: "ciCommitterName"
      authorEmail: "ciCommitterEmail"
    })

  it "drone", ->
    resetEnv = mockedEnv({
      DRONE: "true"

      DRONE_JOB_NUMBER: "droneJobNumber"
      DRONE_BUILD_LINK: "droneBuildLink"
      DRONE_BUILD_NUMBER: "droneBuildNumber"
      DRONE_PULL_REQUEST: "dronePullRequest"

      DRONE_COMMIT_SHA: "droneCommitSha"
      DRONE_COMMIT_BRANCH: "droneCommitBranch"
      DRONE_COMMIT_MESSAGE: "droneCommitMessage"
      DRONE_COMMIT_AUTHOR: "droneCommitAuthor"
      DRONE_COMMIT_AUTHOR_EMAIL: "droneCommitAuthorEmail"
      DRONE_REPO_BRANCH: "droneRepoBranch"
    }, {clear: true})

    expectsName("drone")
    expectsCiParams({
      droneJobNumber: "droneJobNumber"
      droneBuildLink: "droneBuildLink"
      droneBuildNumber: "droneBuildNumber"
      dronePullRequest: "dronePullRequest"
    })
    expectsCommitParams({
      sha: "droneCommitSha"
      branch: "droneCommitBranch"
      message: "droneCommitMessage"
      authorName: "droneCommitAuthor"
      authorEmail: "droneCommitAuthorEmail"
      defaultBranch: "droneRepoBranch"
    })

  it "gitlab", ->
    resetEnv = mockedEnv({
      GITLAB_CI: "true"

      # Gitlab has job id and build id as synonyms
      CI_BUILD_ID: "ciJobId"
      CI_JOB_ID: "ciJobId"
      CI_JOB_URL: "ciJobUrl"

      CI_PIPELINE_ID: "ciPipelineId"
      CI_PIPELINE_URL: "ciPipelineUrl"

      GITLAB_HOST: "gitlabHost"
      CI_PROJECT_ID: "ciProjectId"
      CI_PROJECT_URL: "ciProjectUrl"
      CI_REPOSITORY_URL: "ciRepositoryUrl"
      CI_ENVIRONMENT_URL: "ciEnvironmentUrl"

      CI_COMMIT_SHA: "ciCommitSha"
      CI_COMMIT_REF_NAME: "ciCommitRefName"
      CI_COMMIT_MESSAGE: "ciCommitMessage"
      GITLAB_USER_NAME: "gitlabUserName"
      GITLAB_USER_EMAIL: "gitlabUserEmail"
    }, {clear: true})

    expectsName("gitlab")
    expectsCiParams({
      ciJobId: "ciJobId"
      ciJobUrl: "ciJobUrl"
      ciBuildId: "ciJobId"
      ciPipelineId: "ciPipelineId"
      ciPipelineUrl: "ciPipelineUrl"
      gitlabHost: "gitlabHost"
      ciProjectId: "ciProjectId"
      ciProjectUrl: "ciProjectUrl"
      ciRepositoryUrl: "ciRepositoryUrl"
      ciEnvironmentUrl: "ciEnvironmentUrl"
    })
    expectsCommitParams({
      sha: "ciCommitSha"
      branch: "ciCommitRefName"
      message: "ciCommitMessage"
      authorName: "gitlabUserName"
      authorEmail: "gitlabUserEmail"
    })

    resetEnv = mockedEnv({
      CI_SERVER_NAME: "GitLab CI"
    }, {clear: true})

    expectsName("gitlab")

    resetEnv = mockedEnv({
      CI_SERVER_NAME: "GitLab"
    }, {clear: true})

    expectsName("gitlab")

  it.only "jenkins", ->
    resetEnv = mockedEnv({
      JENKINS_URL: "true"

      BUILD_ID: "buildId"
      BUILD_URL: "buildUrl"
      BUILD_NUMBER: "buildNumber"
      ghprbPullId: "gbprbPullId"

      GIT_COMMIT: "gitCommit"
      GIT_BRANCH: "gitBranch"
    }, {clear: true})

    expectsName("jenkins")
    expectsCiParams({
      buildId: "buildId"
      buildUrl: "buildUrl"
      buildNumber: "buildNumber"
      ghprbPullId: "gbprbPullId"
    })
    expectsCommitParams({
      sha: "gitCommit"
      branch: "gitBranch"
    })

    resetEnv = mockedEnv({
      JENKINS_HOME: "/path/to/jenkins"
    }, {clear: true})
    expectsName("jenkins")

    resetEnv = mockedEnv({
      JENKINS_VERSION: "1.2.3"
    }, {clear: true})
    expectsName("jenkins")

    resetEnv = mockedEnv({
      HUDSON_HOME: "/path/to/jenkins"
    }, {clear: true})
    expectsName("jenkins")

    resetEnv = mockedEnv({
      HUDSON_URL: "true"
    }, {clear: true})
    expectsName("jenkins")

  it "semaphore", ->
    process.env.SEMAPHORE = true

    process.env.SEMAPHORE_BRANCH_ID = "semaphoreBranchId"
    process.env.SEMAPHORE_BUILD_NUMBER = "semaphoreBuildNumber"
    process.env.SEMAPHORE_CURRENT_JOB = "semaphoreCurrentJob"
    process.env.SEMAPHORE_CURRENT_THREAD = "semaphoreCurrentThread"
    process.env.SEMAPHORE_EXECUTABLE_UUID = "semaphoreExecutableUuid"
    process.env.SEMAPHORE_JOB_COUNT = "semaphoreJobCount"
    process.env.SEMAPHORE_JOB_UUID = "semaphoreJobUuid"
    process.env.SEMAPHORE_PLATFORM = "semaphorePlatform"
    process.env.SEMAPHORE_PROJECT_DIR = "semaphoreProjectDir"
    process.env.SEMAPHORE_PROJECT_HASH_ID = "semaphoreProjectHashId"
    process.env.SEMAPHORE_PROJECT_NAME = "semaphoreProjectName"
    process.env.SEMAPHORE_PROJECT_UUID = "semaphoreProjectUuid"
    process.env.SEMAPHORE_REPO_SLUG = "semaphoreRepoSlug"
    process.env.SEMAPHORE_TRIGGER_SOURCE = "semaphoreTriggerSource"
    process.env.PULL_REQUEST_NUMBER = "pullRequestNumber"

    process.env.REVISION = "revision"
    process.env.BRANCH_NAME = "branchName"

    expectsName("semaphore")
    expectsCiParams({
      pullRequestNumber: "pullRequestNumber"
      semaphoreBranchId: "semaphoreBranchId"
      semaphoreBuildNumber: "semaphoreBuildNumber"
      semaphoreCurrentJob: "semaphoreCurrentJob"
      semaphoreCurrentThread: "semaphoreCurrentThread"
      semaphoreExecutableUuid: "semaphoreExecutableUuid"
      semaphoreJobCount: "semaphoreJobCount"
      semaphoreJobUuid: "semaphoreJobUuid"
      semaphorePlatform: "semaphorePlatform"
      semaphoreProjectDir: "semaphoreProjectDir"
      semaphoreProjectHashId: "semaphoreProjectHashId"
      semaphoreProjectName: "semaphoreProjectName"
      semaphoreProjectUuid: "semaphoreProjectUuid"
      semaphoreRepoSlug: "semaphoreRepoSlug"
      semaphoreTriggerSource: "semaphoreTriggerSource"
    })
    expectsCommitParams({
      sha: "revision"
      branch: "branchName"
    })

  it "shippable", ->
    process.env.SHIPPABLE = "true"

    # build environment variables
    process.env.SHIPPABLE_BUILD_ID = "buildId"
    process.env.SHIPPABLE_BUILD_NUMBER = "buildNumber"
    process.env.SHIPPABLE_COMMIT_RANGE = "commitRange"
    process.env.SHIPPABLE_CONTAINER_NAME = "containerName"
    process.env.SHIPPABLE_JOB_ID = "jobId"
    process.env.SHIPPABLE_JOB_NUMBER = "jobNumber"
    process.env.SHIPPABLE_REPO_SLUG = "repoSlug"

    # additional information
    process.env.IS_FORK = "isFork"
    process.env.IS_GIT_TAG = "isGitTag"
    process.env.IS_PRERELEASE = "isPrerelease"
    process.env.IS_RELEASE = "isRelease"
    process.env.REPOSITORY_URL = "repositoryUrl"
    process.env.REPO_FULL_NAME = "repoFullName"
    process.env.REPO_NAME = "repoName"
    process.env.BUILD_URL = "buildUrl"

    # pull request variables
    process.env.BASE_BRANCH = "baseBranch"
    process.env.HEAD_BRANCH = "headBranch"
    process.env.IS_PULL_REQUEST = "isPullRequest"
    process.env.PULL_REQUEST = "pullRequest"
    process.env.PULL_REQUEST_BASE_BRANCH = "pullRequestBaseBranch"
    process.env.PULL_REQUEST_REPO_FULL_NAME = "pullRequestRepoFullName"

    # git information
    process.env.COMMIT = "commit"
    process.env.BRANCH = "branch"
    process.env.COMMITTER = "committer"
    process.env.COMMIT_MESSAGE = "commitMessage"

    expectsName("shippable")
    expectsCiParams({
      # build information
      shippableBuildId: "buildId"
      shippableBuildNumber: "buildNumber"
      shippableCommitRange: "commitRange"
      shippableContainerName: "containerName"
      shippableJobId: "jobId"
      shippableJobNumber: "jobNumber"
      shippableRepoSlug: "repoSlug"
      # additional information
      isFork: "isFork"
      isGitTag: "isGitTag"
      isPrerelease: "isPrerelease"
      isRelease: "isRelease"
      repositoryUrl: "repositoryUrl"
      repoFullName: "repoFullName"
      repoName: "repoName"
      buildUrl: "buildUrl"
      # pull request information
      baseBranch: "baseBranch"
      headBranch: "headBranch"
      isPullRequest: "isPullRequest"
      pullRequest: "pullRequest"
      pullRequestBaseBranch: "pullRequestBaseBranch"
      pullRequestRepoFullName: "pullRequestRepoFullName"
    })
    expectsCommitParams({
      sha: "commit"
      branch: "branch"
      message: "commitMessage"
      authorName: "committer"
    })

  it "snap", ->
    process.env.SNAP_CI = true

    expectsName("snap")
    expectsCiParams(null)
    expectsCommitParams(null)

  it "teamcity", ->
    process.env.TEAMCITY_VERSION = true

    expectsName("teamcity")
    expectsCiParams(null)
    expectsCommitParams(null)

  it "teamfoundation", ->
    process.env.TF_BUILD = true

    process.env.BUILD_BUILDID = "buildId"
    process.env.BUILD_BUILDNUMBER = "buildNumber"
    process.env.BUILD_CONTAINERID = "containerId"

    process.env.BUILD_SOURCEVERSION = "commit"
    process.env.BUILD_SOURCEBRANCHNAME = "branch"
    process.env.BUILD_SOURCEVERSIONMESSAGE = "message"
    process.env.BUILD_SOURCEVERSIONAUTHOR = "name"

    expectsName("teamfoundation")
    expectsCiParams({
      buildBuildid: "buildId"
      buildBuildnumber: "buildNumber"
      buildContainerid: "containerId"
    })
    expectsCommitParams({
      sha: "commit"
      branch: "branch"
      message: "message"
      authorName: "name"
    })

  it "travis", ->
    process.env.TRAVIS = true

    process.env.TRAVIS_JOB_ID = "travisJobId"
    process.env.TRAVIS_BUILD_ID = "travisBuildId"
    process.env.TRAVIS_REPO_SLUG = "travisRepoSlug"
    process.env.TRAVIS_JOB_NUMBER = "travisJobNumber"
    process.env.TRAVIS_EVENT_TYPE = "travisEventType"
    process.env.TRAVIS_COMMIT_RANGE = "travisCommitRange"
    process.env.TRAVIS_BUILD_NUMBER = "travisBuildNumber"
    process.env.TRAVIS_PULL_REQUEST = "travisPullRequest"
    process.env.TRAVIS_PULL_REQUEST_BRANCH = "travisPullRequestBranch"

    process.env.TRAVIS_COMMIT = "travisCommit"
    process.env.TRAVIS_BRANCH = "travisBranch"
    process.env.TRAVIS_COMMIT_MESSAGE = "travisCommitMessage"

    expectsName("travis")
    expectsCiParams({
      travisJobId: "travisJobId"
      travisBuildId: "travisBuildId"
      travisRepoSlug: "travisRepoSlug"
      travisJobNumber: "travisJobNumber"
      travisEventType: "travisEventType"
      travisCommitRange: "travisCommitRange"
      travisBuildNumber: "travisBuildNumber"
      travisPullRequest: "travisPullRequest"
      travisPullRequestBranch: "travisPullRequestBranch"
    })
    expectsCommitParams({
      sha: "travisCommit"
      branch: "travisPullRequestBranch"
      message: "travisCommitMessage"
    })

    resetEnv()
    process.env.TRAVIS = true
    process.env.TRAVIS_BRANCH = "travisBranch"
    expectsCommitParams({
      branch: "travisBranch"
    })

  it "wercker", ->
    process.env.WERCKER = true

    expectsName("wercker")
    expectsCiParams(null)
    expectsCommitParams(null)

    resetEnv()
    process.env.WERCKER_MAIN_PIPELINE_STARTED = true
    expectsName("wercker")
