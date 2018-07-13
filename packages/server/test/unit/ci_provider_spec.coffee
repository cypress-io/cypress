R = require("ramda")
require("../spec_helper")

ciProvider = require("#{root}lib/util/ci_provider")

describe "lib/util/ci_provider", ->
  beforeEach ->
    @env = JSON.stringify(process.env)

    process.env = {}

    @expects = (obj) ->
      expect(ciProvider.name()).to.eq(obj.name)
      expect(ciProvider.params()).to.deep.eq(obj.params)

      # collect Git commit information if needed
      if obj.gitInfo
        # create an object with just keys and empty values
        # to force code to collect the values
        existingGitInfo = R.mapObjIndexed(R.always(null))(obj.gitInfo)
        expect(ciProvider.gitInfo(existingGitInfo)).to.deep.eq(obj.gitInfo)

  afterEach ->
    ## restore the env
    process.env = JSON.parse(@env)

  context "getCirclePrNumber", ->
    it "uses PR number or parses PR url", ->
      # different cases: no information, PR number, PR url
      expect(ciProvider.getCirclePrNumber()).to.equal(undefined)
      expect(ciProvider.getCirclePrNumber('100')).to.equal('100')
      expect(ciProvider.getCirclePrNumber('100', 'https://github.com/cypress-io/cypress/pull/2114')).to.equal('100')
      expect(ciProvider.getCirclePrNumber(undefined, 'https://github.com/cypress-io/cypress/pull/2114')).to.equal('2114')

  it "returns 'unknown' when not found", ->
    process.env = {}

    @expects({
      name: "unknown"
      buildNum: null
      params: null
    })

  it "appveyor", ->
    process.env.APPVEYOR = true
    process.env.APPVEYOR_ACCOUNT_NAME = "account"
    process.env.APPVEYOR_PROJECT_SLUG = "project"
    process.env.APPVEYOR_BUILD_VERSION = "1.0.1"
    process.env.APPVEYOR_BUILD_NUMBER = "1"
    process.env.APPVEYOR_JOB_ID = "2"

    @expects({
      name: "appveyor"
      params: {
        accountName: "account"
        buildNumber: "1"
        buildVersion: "1.0.1"
        jobId: "2"
        projectSlug: "project"
      }
    })

  it "bamboo", ->
    process.env.bamboo_planKey = true

    @expects({
      name: "bamboo"
      buildNum: null
      params: null
    })

  it "buildkite", ->
    process.env.BUILDKITE = true

    @expects({
      name: "buildkite",
      buildNum: null
      params: null
    })

  context "circle", ->
    it "has build number", ->
      process.env.CIRCLECI = true
      process.env.CIRCLE_BUILD_URL = "circle build url"
      process.env.CIRCLE_BUILD_NUM = "4"
      process.env.CIRCLE_WORKFLOW_ID = "5"

      @expects({
        name: "circle",
        buildNum: null
        params: {
          buildUrl: "circle build url"
          buildNumber: "4"
          workflowId: "5"
        },
        # does not have PR number or default branch
        gitInfo: {
          pullRequestId: null,
          defaultBranch: null
        }
      })

    it "has forked PR number", ->
      process.env.CIRCLECI = true
      process.env.CIRCLE_BUILD_URL = "circle build url"
      process.env.CIRCLE_BUILD_NUM = "4"
      process.env.CIRCLE_PR_NUMBER = "100"
      process.env.CIRCLE_WORKFLOW_ID = "5"

      @expects({
        name: "circle",
        buildNum: null,
        params: {
          buildUrl: "circle build url"
          buildNumber: "4"
          workflowId: "5"
        },
        gitInfo: {
          pullRequestId: '100',
          defaultBranch: null
        }
      })

    it "has non-forked PR number", ->
      process.env.CIRCLECI = true
      process.env.CIRCLE_BUILD_URL = "circle build url"
      process.env.CIRCLE_BUILD_NUM = "4"
      # non-forked PR has number in the URL
      process.env.CIRCLE_PULL_REQUEST = "https://github.com/cypress-io/cypress/pull/100"
      process.env.CIRCLE_WORKFLOW_ID = "5"

      @expects({
        name: "circle",
        buildNum: null,
        params: {
          buildUrl: "circle build url"
          buildNumber: "4"
          workflowId: "5"
        },
        gitInfo: {
          pullRequestId: '100',
          defaultBranch: null
        }
      })

  it "codeship", ->
    process.env.CI_NAME = "codeship"
    process.env.CI_BUILD_URL = "codeship build url"
    process.env.CI_BUILD_NUMBER = "5"
    process.env.CI_BUILD_ID = "6"

    @expects({
      name: "codeship",
      buildNum: null
      params: {
        buildId: "6"
        buildNumber: "5"
        buildUrl: "codeship build url"
      }
    })

  it "drone", ->
    process.env.DRONE = true
    process.env.DRONE_BUILD_NUMBER = "1234"
    process.env.DRONE_BUILD_LINK = "some url"
    process.env.DRONE_JOB_NUMBER = "5678"

    @expects({
      name: "drone",
      buildNum: null
      params: {
        buildNumber: "1234"
        jobNumber: "5678"
        buildUrl: "some url"
      }
    })

  it "gitlab via GITLAB_CI", ->
    process.env.GITLAB_CI = true
    process.env.CI_BUILD_ID = "7"
    process.env.CI_PROJECT_URL = "http://gitlab.com/foo/bar"
    process.env.CI_JOB_ID = "8"

    @expects({
      name: "gitlab",
      buildNum: null
      params: {
        buildId: "7"
        jobId: "8"
        projectUrl: "http://gitlab.com/foo/bar"
      }
    })

  it "gitlab via CI_SERVER_NAME", ->
    process.env.CI_SERVER_NAME = "GitLab CI"
    process.env.CI_BUILD_ID = "7"
    process.env.CI_PROJECT_URL = "http://gitlab.com/foo/bar"
    process.env.CI_JOB_ID = "8"

    @expects({
      name: "gitlab"
      buildNum: null
      params: {
        buildId: "7"
        jobId: "8"
        projectUrl: "http://gitlab.com/foo/bar"
      }
    })

  it "hudson", ->
    process.env.HUDSON_URL = true

    @expects({
      name: "hudson",
      buildNum: null
      params: null
    })

  it "jenkins", ->
    process.env.JENKINS_URL = true
    process.env.BUILD_URL = "jenkins build url"
    process.env.BUILD_NUMBER = "9"
    process.env.BUILD_ID = "10"

    @expects({
      name: "jenkins",
      buildNum: null
      params: {
        buildId: "10"
        buildNumber: "9"
        buildUrl: "jenkins build url"
      }
    })

  it "semaphore", ->
    process.env.SEMAPHORE = true
    process.env.SEMAPHORE_BUILD_NUMBER = "46"
    process.env.SEMAPHORE_REPO_SLUG = "rails/rails"

    @expects({
      name: "semaphore"
      buildNum: null
      params: {
        buildNumber: "46"
        repoSlug: "rails/rails"
      }
    })

  it "shippable", ->
    process.env.SHIPPABLE = true
    process.env.BUILD_NUMBER = "11"
    process.env.JOB_ID = "12"
    process.env.JOB_NUMBER = "13"

    @expects({
      name: "shippable"
      buildNum: null
      params: {
        buildNumber: "11"
        jobId: "12"
        jobNumber: "13"
      }
    })

  it "snap", ->
    process.env.SNAP_CI = true

    @expects({
      name: "snap"
      buildNum: null
      params: null
    })

  it "teamcity", ->
    process.env.TEAMCITY_VERSION = true

    @expects({
      name: "teamcity"
      buildNum: null
      params: null
    })

  it "teamfoundation", ->
    process.env.TF_BUILD = true

    @expects({
      name: "teamfoundation"
      buildNum: null
      params: null
    })

  it "travis", ->
    process.env.TRAVIS = true
    process.env.TRAVIS_BUILD_ID = "id-123"
    process.env.TRAVIS_BUILD_NUMBER = "15"
    process.env.TRAVIS_REPO_SLUG = "travis-repo-slug"
    process.env.TRAVIS_JOB_ID = "16"
    process.env.TRAVIS_JOB_NUMBER = "17"

    @expects({
      name: "travis",
      buildNum: null
      params: {
        buildId: "id-123"
        buildNumber: "15"
        jobId: "16"
        jobNumber: "17"
        repoSlug: "travis-repo-slug"
      }
    })

  it "wercker", ->
    process.env.WERCKER = true

    @expects({
      name: "wercker"
      buildNum: null
      params: null
    })

  it "wercker", ->
    process.env.WERCKER_MAIN_PIPELINE_STARTED = true

    @expects({
      name: "wercker"
      buildNum: null
      params: null
    })
