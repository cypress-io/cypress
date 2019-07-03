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
  expect(expected).to.be.an("object")
  expect(ciProvider.commitDefaults(existing), "CI providers default git params").to.deep.eq(expected)

describe "lib/util/ci_provider", ->
  resetEnv = null

  afterEach ->
    # we need to reset environment
    # to avoid affecting tests in other suites
    resetEnv?()

  it "null when unknown", ->
    resetEnv = mockedEnv({}, {clear: true})

    expectsName(null)
    expectsCiParams(null)
    expectsCommitParams(null)

  it "does not extract from commit environment variables yet", ->
    # see fallback environment variables
    # https://github.com/cypress-io/commit-info#fallback-environment-variables
    # BUT those defaults are NOT used by "ci_provider"
    # instead they are used in the "record" module
    # this test just confirms that these defaults are not considered
    env = {
      COMMIT_INFO_BRANCH: "my-branch-221",
      COMMIT_INFO_MESSAGE: "best commit ever",
      COMMIT_INFO_EMAIL: "user@company.com",
      COMMIT_INFO_AUTHOR: "Agent Smith",
      COMMIT_INFO_SHA: "0123456",
      COMMIT_INFO_REMOTE: "remote repo"
    }
    resetEnv = mockedEnv(env, {clear: true})

    expectsName(null) # we don't know CI
    expectsCiParams(null) # we don't know CI params
    expectsCommitParams(null) # we don't know CI-specific params

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
      branch: "appveyorPullRequestHeadRepoBranch"
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
    expectsCommitDefaults({
      sha: undefined
      branch: ""
    }, {
      sha: "bitbucketCommit"
      branch: "bitbucketBranch"
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

    # in this test only interested in branch and sha for example
    expectsCommitDefaults({
      sha: null,
      branch: "gitFoundBranch"
    }, {
      sha: "buildKiteCommit",
      branch: "gitFoundBranch"
    })
    expectsCommitDefaults({
      sha: undefined,
      branch: ""
    }, {
      sha: "buildKiteCommit",
      branch: "buildKiteBranch"
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

  it "codeshipBasic", ->
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

  it "concourse", ->
    resetEnv = mockedEnv({
      CONCOURSE_WORK_DIR: "/opt/concourse/worker"

      BUILD_ID: "ciBuildId"
    }, {clear: true})

    expectsName("concourse")
    expectsCiParams({
      buildId: "ciBuildId"
    })
    expectsCommitParams(null)

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
  it "goCD", ->
    resetEnv = mockedEnv({
      GO_SERVER_URL: "https://127.0.0.1:8154/go",
      GO_ENVIRONMENT_NAME: "Development",
      GO_PIPELINE_NAME: "main",
      GO_PIPELINE_COUNTER: "2345",
      GO_PIPELINE_LABEL: "1.1.2345",
      GO_STAGE_NAME: "dev",
      GO_STAGE_COUNTER: "1",
      GO_JOB_NAME: "linux-firefox",
      GO_TRIGGER_USER: "changes",
      GO_REVISION: "123",
      GO_TO_REVISION: "123",
      GO_FROM_REVISION: "121",
      GO_MATERIAL_HAS_CHANGED: "true",
    }, {clear: true})

    expectsName("goCD")
    expectsCiParams({
      goServerUrl: "https://127.0.0.1:8154/go",
      goEnvironmentName: "Development",
      goPipelineName: "main",
      goPipelineCounter: "2345",
      goPipelineLabel: "1.1.2345",
      goStageName: "dev",
      goStageCounter: "1",
      goJobName: "linux-firefox",
      goTriggerUser: "changes",
      goRevision: "123",
      goToRevision: "123",
      goFromRevision: "121",
      goMaterialHasChanged: "true",
    })
    expectsCommitParams(null)

  it "google cloud", ->
    resetEnv = mockedEnv({
      GCP_PROJECT: "123"

      BUILD_ID: "buildId"

      PROJECT_ID: "projectId"

      COMMIT_SHA: "commitSha"
      BRANCH_NAME: "branchName"
    }, {clear: true})

    expectsName("googleCloud")
    expectsCiParams({
      buildId: "buildId"
      projectId: "projectId"
      commitSha: "commitSha"
      branchName: "branchName"
    })
    expectsCommitParams({
      sha: "commitSha"
      branch: "branchName"
    })

    resetEnv = mockedEnv({
      GCLOUD_PROJECT: "123"
    }, {clear: true})

    expectsName("googleCloud")

    resetEnv = mockedEnv({
      GOOGLE_CLOUD_PROJECT: "123"
    }, {clear: true})

    expectsName("googleCloud")

  it "jenkins", ->
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
    resetEnv = mockedEnv({
      SEMAPHORE: "true"

      SEMAPHORE_BRANCH_ID: "semaphoreBranchId"
      SEMAPHORE_BUILD_NUMBER: "semaphoreBuildNumber"
      SEMAPHORE_CURRENT_JOB: "semaphoreCurrentJob"
      SEMAPHORE_CURRENT_THREAD: "semaphoreCurrentThread"
      SEMAPHORE_EXECUTABLE_UUID: "semaphoreExecutableUuid"
      SEMAPHORE_JOB_COUNT: "semaphoreJobCount"
      SEMAPHORE_JOB_UUID: "semaphoreJobUuid"
      SEMAPHORE_PLATFORM: "semaphorePlatform"
      SEMAPHORE_PROJECT_DIR: "semaphoreProjectDir"
      SEMAPHORE_PROJECT_HASH_ID: "semaphoreProjectHashId"
      SEMAPHORE_PROJECT_NAME: "semaphoreProjectName"
      SEMAPHORE_PROJECT_UUID: "semaphoreProjectUuid"
      SEMAPHORE_REPO_SLUG: "semaphoreRepoSlug"
      SEMAPHORE_TRIGGER_SOURCE: "semaphoreTriggerSource"
      PULL_REQUEST_NUMBER: "pullRequestNumber"

      REVISION: "revision"
      BRANCH_NAME: "branchName"
    }, {clear: true})

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
    resetEnv = mockedEnv({
      SHIPPABLE: "true"

      # build environment variables
      SHIPPABLE_BUILD_ID: "buildId"
      SHIPPABLE_BUILD_NUMBER: "buildNumber"
      SHIPPABLE_COMMIT_RANGE: "commitRange"
      SHIPPABLE_CONTAINER_NAME: "containerName"
      SHIPPABLE_JOB_ID: "jobId"
      SHIPPABLE_JOB_NUMBER: "jobNumber"
      SHIPPABLE_REPO_SLUG: "repoSlug"

      # additional information
      IS_FORK: "isFork"
      IS_GIT_TAG: "isGitTag"
      IS_PRERELEASE: "isPrerelease"
      IS_RELEASE: "isRelease"
      REPOSITORY_URL: "repositoryUrl"
      REPO_FULL_NAME: "repoFullName"
      REPO_NAME: "repoName"
      BUILD_URL: "buildUrl"

      # pull request variables
      BASE_BRANCH: "baseBranch"
      HEAD_BRANCH: "headBranch"
      IS_PULL_REQUEST: "isPullRequest"
      PULL_REQUEST: "pullRequest"
      PULL_REQUEST_BASE_BRANCH: "pullRequestBaseBranch"
      PULL_REQUEST_REPO_FULL_NAME: "pullRequestRepoFullName"

      # git information
      COMMIT: "commit"
      BRANCH: "branch"
      COMMITTER: "committer"
      COMMIT_MESSAGE: "commitMessage"
    }, {clear: true})

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

  it "teamcity", ->
    resetEnv = mockedEnv({
      TEAMCITY_VERSION: "true"
    }, {clear: true})

    expectsName("teamcity")
    expectsCiParams(null)
    expectsCommitParams(null)

  it "azure", ->
    resetEnv = mockedEnv({
      # these two variables tell us it is Azure CI
      TF_BUILD: "true"
      AZURE_HTTP_USER_AGENT: "VSTS_5e0090d5-c5b9-4fab-8fd8-ce288e9fb666_build_2_0"

      BUILD_BUILDID: "buildId"
      BUILD_BUILDNUMBER: "buildNumber"
      BUILD_CONTAINERID: "containerId"
      BUILD_REPOSITORY_URI: "buildRepositoryUri"

      BUILD_SOURCEVERSION: "commit"
      BUILD_SOURCEBRANCHNAME: "branch"
      BUILD_SOURCEVERSIONMESSAGE: "message"
      BUILD_SOURCEVERSIONAUTHOR: "name"
      BUILD_REQUESTEDFOREMAIL: "email"
    }, {clear: true})

    expectsName("azure")
    expectsCiParams({
      buildBuildid: "buildId"
      buildBuildnumber: "buildNumber"
      buildContainerid: "containerId"
      buildRepositoryUri: "buildRepositoryUri"
    })
    expectsCommitParams({
      sha: "commit"
      branch: "branch"
      message: "message"
      authorName: "name"
      authorEmail: "email"
    })

  it "teamfoundation", ->
    resetEnv = mockedEnv({
      TF_BUILD: "true"
      TF_BUILD_BUILDNUMBER: "CIBuild_20130613.6"

      BUILD_BUILDID: "buildId"
      BUILD_BUILDNUMBER: "buildNumber"
      BUILD_CONTAINERID: "containerId"

      BUILD_SOURCEVERSION: "commit"
      BUILD_SOURCEBRANCHNAME: "branch"
      BUILD_SOURCEVERSIONMESSAGE: "message"
      BUILD_SOURCEVERSIONAUTHOR: "name"
    }, {clear: true})

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
    resetEnv = mockedEnv({
      TRAVIS: "true"

      TRAVIS_JOB_ID: "travisJobId"
      TRAVIS_BUILD_ID: "travisBuildId"
      TRAVIS_REPO_SLUG: "travisRepoSlug"
      TRAVIS_JOB_NUMBER: "travisJobNumber"
      TRAVIS_EVENT_TYPE: "travisEventType"
      TRAVIS_COMMIT_RANGE: "travisCommitRange"
      TRAVIS_BUILD_NUMBER: "travisBuildNumber"
      TRAVIS_PULL_REQUEST: "travisPullRequest"
      TRAVIS_PULL_REQUEST_BRANCH: "travisPullRequestBranch"

      TRAVIS_COMMIT: "travisCommit"
      TRAVIS_BRANCH: "travisBranch"
      TRAVIS_COMMIT_MESSAGE: "travisCommitMessage"
    }, {clear: true})

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

    resetEnv = mockedEnv({
      TRAVIS: "true"
      TRAVIS_BRANCH: "travisBranch"
    }, {clear: true})

    expectsCommitParams({
      branch: "travisBranch"
    })

  it "wercker", ->
    resetEnv = mockedEnv({
      WERCKER: "true"
    }, {clear: true})

    expectsName("wercker")
    expectsCiParams(null)
    expectsCommitParams(null)

    resetEnv = mockedEnv({
      WERCKER_MAIN_PIPELINE_STARTED: "true"
    }, {clear: true})

    expectsName("wercker")
