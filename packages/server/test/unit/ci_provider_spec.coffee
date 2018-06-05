require("../spec_helper")

ciProvider = require("#{root}lib/util/ci_provider")

describe "lib/util/ci_provider", ->
  beforeEach ->
    @env = JSON.stringify(process.env)

    process.env = {}

    @expects = (obj) ->
      expect(ciProvider.name()).to.eq(obj.name)
      expect(ciProvider.buildNum()).to.eq(obj.buildNum)
      expect(ciProvider.params()).to.deep.eq(obj.params)

  afterEach ->
    ## restore the env
    process.env = JSON.parse(@env)

  context "group-id", ->
    describe "circle", ->
      beforeEach ->
        process.env.CIRCLECI = true
        process.env.CIRCLE_BUILD_URL = "circle build url"
        process.env.CIRCLE_BUILD_NUM = "4"

      it "grabs workflow id as group id", ->
        id = "1234-group-id"
        process.env.CIRCLE_WORKFLOW_ID = id
        expect(ciProvider.groupId()).to.equal(id)

      it "no group id without workflow id", ->
        expect(ciProvider.groupId()).to.be.null


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

    @expects({
      name: "appveyor"
      buildNum: "1"
      params: {
        accountName: "account"
        projectSlug: "project"
        buildVersion: "1.0.1"
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

  it "circle", ->
    process.env.CIRCLECI = true
    process.env.CIRCLE_BUILD_URL = "circle build url"
    process.env.CIRCLE_BUILD_NUM = "4"

    @expects({
      name: "circle",
      buildNum: "4"
      params: {
        buildUrl: "circle build url"
      }
    })

  it "codeship", ->
    process.env.CI_NAME = "codeship"
    process.env.CI_BUILD_URL = "codeship build url"
    process.env.CI_BUILD_NUMBER = "5"

    @expects({
      name: "codeship",
      buildNum: "5"
      params: {
        buildUrl: "codeship build url"
      }
    })

  it "drone", ->
    process.env.DRONE = true
    process.env.DRONE_BUILD_NUMBER = "1234"
    process.env.DRONE_BUILD_LINK = "some url"

    @expects({
      name: "drone",
      buildNum: "1234"
      params: {
        buildUrl: "some url"
      }
    })

  it "gitlab via GITLAB_CI", ->
    process.env.GITLAB_CI = true
    process.env.CI_BUILD_ID = "7"
    process.env.CI_PROJECT_URL = "http://gitlab.com/foo/bar"

    @expects({
      name: "gitlab",
      buildNum: "7"
      params: {
        buildId: "7"
        projectUrl: "http://gitlab.com/foo/bar"
      }
    })

  it "gitlab via CI_SERVER_NAME", ->
    process.env.CI_SERVER_NAME = "GitLab CI"
    process.env.CI_BUILD_ID = "7"
    process.env.CI_PROJECT_URL = "http://gitlab.com/foo/bar"

    @expects({
      name: "gitlab"
      buildNum: "7"
      params: {
        buildId: "7"
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

    @expects({
      name: "jenkins",
      buildNum: "9"
      params: {
        buildUrl: "jenkins build url"
      }
    })

  it "semaphore", ->
    process.env.SEMAPHORE = true
    process.env.SEMAPHORE_BUILD_NUMBER = "46"
    process.env.SEMAPHORE_REPO_SLUG = "rails/rails"

    @expects({
      name: "semaphore"
      buildNum: "46"
      params: {
        repoSlug: "rails/rails"
      }
    })

  it "shippable", ->
    process.env.SHIPPABLE = true

    @expects({
      name: "shippable"
      buildNum: null
      params: null
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

    @expects({
      name: "travis",
      buildNum: "15"
      params: {
        buildId: "id-123"
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
