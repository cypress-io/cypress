require("../../spec_helper")

_          = require("lodash")
os         = require("os")
commitInfo = require("@cypress/commit-info")
api        = require("#{root}../lib/api")
errors     = require("#{root}../lib/errors")
logger     = require("#{root}../lib/logger")
upload     = require("#{root}../lib/upload")
browsers   = require("#{root}../lib/browsers")
recordMode = require("#{root}../lib/modes/record")
system     = require("#{root}../lib/util/system")
ciProvider = require("#{root}../lib/util/ci_provider")

initialEnv = _.clone(process.env)

## NOTE: the majority of the logic of record_spec is
## tested as an e2e/record_spec
describe "lib/modes/record", ->
  ## QUESTION: why are these tests here when
  ## this is a module... ?
  context "commitInfo.getBranch", ->
    beforeEach ->
      delete process.env.CIRCLE_BRANCH
      delete process.env.TRAVIS_BRANCH
      delete process.env.BUILDKITE_BRANCH
      delete process.env.CI_BRANCH

    afterEach ->
      process.env = initialEnv

    it "gets branch from process.env.CIRCLE_BRANCH", ->
      process.env.CIRCLE_BRANCH = "bem/circle"
      process.env.TRAVIS_BRANCH = "bem/travis"
      process.env.CI_BRANCH     = "bem/ci"

      commitInfo.getBranch().then (ret) ->
        expect(ret).to.eq("bem/circle")

    it "gets branch from process.env.TRAVIS_BRANCH", ->
      process.env.TRAVIS_BRANCH = "bem/travis"
      process.env.CI_BRANCH     = "bem/ci"

      commitInfo.getBranch().then (ret) ->
        expect(ret).to.eq("bem/travis")

    it "gets branch from process.env.BUILDKITE_BRANCH", ->
      process.env.BUILDKITE_BRANCH = "bem/buildkite"
      process.env.CI_BRANCH     = "bem/ci"

      commitInfo.getBranch().then (ret) ->
        expect(ret).to.eq("bem/buildkite")

    it "gets branch from process.env.CI_BRANCH", ->
      process.env.CI_BRANCH     = "bem/ci"

      commitInfo.getBranch().then (ret) ->
        expect(ret).to.eq("bem/ci")

    it "gets branch from git"
      # this is tested inside @cypress/commit-info

  context ".createRunAndRecordSpecs", ->
    specs = [
      { relative: "path/to/spec/a" },
      { relative: "path/to/spec/b" }
    ]

    beforeEach ->
      sinon.stub(ciProvider, "name").returns("circle")
      sinon.stub(ciProvider, "params").returns({foo: "bar"})
      sinon.stub(ciProvider, "buildNum").returns("build-123")

      @gitInfo = {
        branch: "master",
        author: "brian",
        email: "brian@cypress.io",
        message: "such hax",
        sha: "sha-123",
        remote: "https://github.com/foo/bar.git"
      }
      sinon.stub(commitInfo, "commitInfo").resolves(@gitInfo)
      sinon.stub(ciProvider, "gitInfo").returns({
        sha: @gitInfo.sha
        branch: @gitInfo.branch
        authorName: @gitInfo.author
        authorEmail: @gitInfo.email
        message: @gitInfo.message
        remoteOrigin: @gitInfo.remote
        pullRequestId: "1"
        defaultBranch: "master"
      })

      sinon.stub(api, "createRun").resolves()

    it "calls api.createRun with the right args", ->
      key = "recordKey"
      projectId = "pId123"
      specPattern = ["spec/pattern1", "spec/pattern2"]
      projectRoot = "project/root"
      runAllSpecs = sinon.stub()
      sys = {
        osCpus: 1
        osName: 2
        osMemory: 3
        osVersion: 4
      }
      browser = {
        displayName: "chrome"
        version: "59"
      }

      recordMode.createRunAndRecordSpecs({
        key
        sys
        specs
        browser
        projectId
        projectRoot
        specPattern
        runAllSpecs
      })
      .then ->
        expect(commitInfo.commitInfo).to.be.calledWith(projectRoot)
        expect(api.createRun).to.be.calledWith({
          projectId
          recordKey: key
          specPattern: "spec/pattern1,spec/pattern2"
          specs: ["path/to/spec/a", "path/to/spec/b"]
          platform: {
            osCpus: 1
            osName: 2
            osMemory: 3
            osVersion: 4
            browserName: "chrome"
            browserVersion: "59"
          }
          ci: {
            params: {foo: "bar"}
            provider: "circle"
            buildNumber: "build-123"
          }
          commit: {
            sha: "sha-123"
            branch: "master"
            authorName: "brian"
            authorEmail: "brian@cypress.io"
            message: "such hax"
            remoteOrigin: "https://github.com/foo/bar.git"
            pullRequestId: "1"
            defaultBranch: "master"
          }
        })

  context ".updateInstanceStdout", ->
    beforeEach ->
      sinon.stub(api, "updateInstanceStdout")

      @options = {
        instanceId: "id-123"
        captured: { toString: -> "foobarbaz\n" }
      }

    it "calls api.updateInstanceStdout", ->
      api.updateInstanceStdout.resolves()

      recordMode.updateInstanceStdout(@options)
      .then ->
        expect(api.updateInstanceStdout).to.be.calledWith({
          instanceId: "id-123"
          stdout: "foobarbaz\n"
        })

    it "retries with backoff strategy", ->
      sinon.stub(api, "retryWithBackoff").yields().resolves()

      recordMode.updateInstanceStdout(@options)
      expect(api.retryWithBackoff).to.be.called

    it "logs on retry", ->
      sinon.stub(api, "retryWithBackoff").yields().resolves()
      sinon.spy(console, "log")

      recordMode.updateInstanceStdout(@options)
      details = {}
      api.retryWithBackoff.lastCall.args[1].onBeforeRetry({})
      expect(console.log).to.be.calledWith("...")

    it "does not createException when statusCode is 503", ->
      err = new Error("foo")
      err.statusCode = 503

      sinon.spy(logger, "createException")

      sinon.stub(api, "retryWithBackoff").rejects(err)

      options = {
        instanceId: "id-123"
        captured: { toString: -> "foobarbaz\n" }
      }

      recordMode.updateInstanceStdout(options)
      .then ->
        expect(logger.createException).not.to.be.called

  context ".createInstance", ->
    beforeEach ->
      sinon.stub(api, "createInstance")

      @options = {
        runId: "run-123",
        groupId: "group-123"
        machineId: "machine-123"
        platform: {}
        spec: { relative: "cypress/integration/app_spec.coffee" }
      }

    it "calls api.createInstance", ->
      api.createInstance.resolves()

      recordMode.createInstance(@options)
      .then ->
        expect(api.createInstance).to.be.calledWith({
          runId: "run-123",
          groupId: "group-123"
          machineId: "machine-123"
          platform: {}
          spec: "cypress/integration/app_spec.coffee"
        })

    it "retries with backoff strategy", ->
      sinon.stub(api, "retryWithBackoff").yields().resolves()

      recordMode.createInstance(@options)
      expect(api.retryWithBackoff).to.be.called

    it "logs on retry", ->
      sinon.stub(api, "retryWithBackoff").yields().resolves()
      sinon.spy(console, "log")

      recordMode.createInstance(@options)
      details = {}
      api.retryWithBackoff.lastCall.args[1].onBeforeRetry({})
      expect(console.log).to.be.calledWith("...")

    it "does not createException when statusCode is 503", ->
      err = new Error("foo")
      err.statusCode = 503

      sinon.spy(logger, "createException")

      sinon.stub(api, "retryWithBackoff").rejects(err)

      recordMode.createInstance({
        runId: "run-123",
        groupId: "group-123"
        machineId: "machine-123"
        platform: {}
        spec: { relative: "cypress/integration/app_spec.coffee" }
      })
      .then (ret) ->
        expect(ret).to.be.null
        expect(logger.createException).not.to.be.called

  context ".createRun", ->
    beforeEach ->
      sinon.stub(api, "createRun")
      sinon.stub(ciProvider, "params").returns({})
      sinon.stub(ciProvider, "name").returns("")
      sinon.stub(ciProvider, "buildNum").returns("")
      sinon.stub(ciProvider, "gitInfo").returns({})

      @options = {
        git: {}
        recordKey: "1"
      }

    it "retries with backoff strategy", ->
      sinon.stub(api, "retryWithBackoff").yields().resolves()

      recordMode.createRun(@options)
      expect(api.retryWithBackoff).to.be.called

    it "logs on retry", ->
      sinon.stub(api, "retryWithBackoff").yields().resolves()
      sinon.spy(console, "log")

      recordMode.createRun(@options)
      details = {}
      api.retryWithBackoff.lastCall.args[1].onBeforeRetry({})
      expect(console.log).to.be.calledWith("...")

  context ".updateInstance", ->
    beforeEach ->
      sinon.stub(api, "updateInstance")
      sinon.stub(ciProvider, "params").returns({})
      sinon.stub(ciProvider, "name").returns("")
      sinon.stub(ciProvider, "buildNum").returns("")
      sinon.stub(ciProvider, "gitInfo").returns({})

      @options = {
        results: {}
        captured: ""
      }

    it "retries with backoff strategy", ->
      sinon.stub(api, "retryWithBackoff").yields().resolves()

      recordMode.updateInstance(@options)
      expect(api.retryWithBackoff).to.be.called

    it "logs on retry", ->
      sinon.stub(api, "retryWithBackoff").yields().resolves()
      sinon.spy(console, "log")

      recordMode.updateInstance(@options)
      details = {}
      api.retryWithBackoff.lastCall.args[1].onBeforeRetry({})
      expect(console.log).to.be.calledWith("...")
