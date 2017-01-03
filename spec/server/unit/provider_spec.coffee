require("../spec_helper")

provider = require("#{root}lib/util/provider")

describe "lib/util/provider", ->
  beforeEach ->
    @env = JSON.stringify(process.env)

    process.env = {}

    @expects = (name, details) ->
      expect(provider.name()).to.eq(name)
      if details
        expect(provider.details()).to.eql(details)

  afterEach ->
    ## restore the env
    process.env = JSON.parse(@env)

  it "returns 'unknown' when not found", ->
    process.env = {}
    @expects("unknown", {
      ciUrl: null
      buildNum: null
    })

  it "appveyor", ->
    process.env.APPVEYOR = true
    process.env.APPVEYOR_ACCOUNT_NAME = "account"
    process.env.APPVEYOR_PROJECT_SLUG = "project"
    process.env.APPVEYOR_BUILD_VERSION = "1.0.1"
    process.env.APPVEYOR_BUILD_NUMBER = "1"
    @expects("appveyor", {
      ciUrl: "https://ci.appveyor.com/project/account/project/build/1.0.1"
      buildNum: "1"
    })

  it "bamboo", ->
    process.env.bamboo_planKey = true
    @expects("bamboo", {
      ciUrl: null
      buildNum: null
    })

  it "buildkite", ->
    process.env.BUILDKITE = true
    @expects("buildkite", {
      ciUrl: null
      buildNum: null
    })

  it "circle", ->
    process.env.CIRCLECI = true
    process.env.CIRCLE_BUILD_URL = "circle build url"
    process.env.CIRCLE_BUILD_NUM = "4"
    @expects("circle", {
      ciUrl: "circle build url"
      buildNum: "4"
    })

  it "codeship", ->
    process.env.CI_NAME = "codeship"
    process.env.CI_BUILD_URL = "codeship build url"
    process.env.CI_BUILD_NUMBER = "5"
    @expects("codeship", {
      ciUrl: "codeship build url"
      buildNum: "5"
    })

  it "drone", ->
    process.env.DRONE = true
    @expects("drone", {
      ciUrl: null
      buildNum: null
    })

  it "gitlab via GITLAB_CI", ->
    process.env.GITLAB_CI = true
    process.env.CI_PROJECT_URL = "http://gitlabprojecturl.com"
    process.env.CI_BUILD_ID = "7"
    @expects("gitlab", {
      ciUrl: "http://gitlabprojecturl.com/builds/7"
      buildNum: "7"
    })

  it "gitlab via CI_SERVER_NAME", ->
    process.env.CI_SERVER_NAME = "GitLab CI"
    @expects("gitlab")

  it "hudson", ->
    process.env.HUDSON_URL = true
    @expects("hudson", {
      ciUrl: null
      buildNum: null
    })

  it "jenkins", ->
    process.env.JENKINS_URL = true
    process.env.BUILD_URL = "jenkins build url"
    process.env.BUILD_NUMBER = "9"
    @expects("jenkins", {
      ciUrl: "jenkins build url"
      buildNum: "9"
    })

  it "semaphore", ->
    process.env.SEMAPHORE = true
    @expects("semaphore", {
      ciUrl: null
      buildNum: null
    })

  it "shippable", ->
    process.env.SHIPPABLE = true
    @expects("shippable", {
      ciUrl: null
      buildNum: null
    })

  it "snap", ->
    process.env.SNAP_CI = true
    @expects("snap", {
      ciUrl: null
      buildNum: null
    })

  it "teamcity", ->
    process.env.TEAMCITY_VERSION = true
    @expects("teamcity", {
      ciUrl: null
      buildNum: null
    })

  it "teamfoundation", ->
    process.env.TF_BUILD = true
    @expects("teamfoundation", {
      ciUrl: null
      buildNum: null
    })

  it "travis", ->
    process.env.TRAVIS = true
    process.env.TRAVIS_BUILD_ID = "travis-build-id"
    process.env.TRAVIS_BUILD_NUMBER = "15"
    process.env.TRAVIS_REPO_SLUG = "travis-repo-slug"
    @expects("travis", {
      ciUrl: "https://travis-ci.org/travis-repo-slug/builds/travis-build-id"
      buildNum: "15"
    })

  it "wercker", ->
    process.env.WERCKER = true
    @expects("wercker", {
      ciUrl: null
      buildNum: null
    })

  it "wercker", ->
    process.env.WERCKER_MAIN_PIPELINE_STARTED = true
    @expects("wercker", {
      ciUrl: null
      buildNum: null
    })
