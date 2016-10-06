require("../spec_helper")

provider = require("#{root}lib/util/provider")

describe "lib/util/provider", ->
  beforeEach ->
    @env = JSON.stringify(process.env)

    process.env = {}

    @expects = (key) ->
      expect(provider.get()).to.eq(key)

  afterEach ->
    ## restore the env
    process.env = JSON.parse(@env)

  it "returns 'unknown' when not found", ->
    process.env = {}
    @expects("unknown")

  it "appveyor", ->
    process.env.APPVEYOR = true
    @expects("appveyor")

  it "bamboo", ->
    process.env.bamboo_planKey = true
    @expects("bamboo")

  it "buildkite", ->
    process.env.BUILDKITE = true
    @expects("buildkite")

  it "circle", ->
    process.env.CIRCLECI = true
    @expects("circle")

  it "codeship", ->
    process.env.CI_NAME = "codeship"
    @expects("codeship")

  it "drone", ->
    process.env.DRONE = true
    @expects("drone")

  it "gitlab", ->
    process.env.GITLAB_CI = true
    @expects("gitlab")

  it "gitlab", ->
    process.env.CI_SERVER_NAME = "GitLab CI"
    @expects("gitlab")

  it "hudson", ->
    process.env.HUDSON_URL = true
    @expects("hudson")

  it "jenkins", ->
    process.env.JENKINS_URL = true
    @expects("jenkins")

  it "semaphore", ->
    process.env.SEMAPHORE = true
    @expects("semaphore")

  it "shippable", ->
    process.env.SHIPPABLE = true
    @expects("shippable")

  it "snap", ->
    process.env.SNAP_CI = true
    @expects("snap")

  it "teamcity", ->
    process.env.TEAMCITY_VERSION = true
    @expects("teamcity")

  it "teamfoundation", ->
    process.env.TF_BUILD = true
    @expects("teamfoundation")

  it "travis", ->
    process.env.TRAVIS = true
    @expects("travis")

  it "wercker", ->
    process.env.WERCKER = true
    @expects("wercker")

  it "wercker", ->
    process.env.WERCKER_MAIN_PIPELINE_STARTED = true
    @expects("wercker")
