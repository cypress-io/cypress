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
      { path: "path/to/spec/a" },
      { path: "path/to/spec/b" }
    ]

    beforeEach ->
      @sandbox.stub(ciProvider, "name").returns("circle")
      @sandbox.stub(ciProvider, "params").returns({foo: "bar"})
      @sandbox.stub(ciProvider, "buildNum").returns("build-123")

      @sandbox.stub(commitInfo, "commitInfo").resolves({
        branch: "master",
        author: "brian",
        email: "brian@cypress.io",
        message: "such hax",
        sha: "sha-123",
        remote: "https://github.com/foo/bar.git"
      })

      @sandbox.stub(browsers, "getByName").resolves({
        displayName: "chrome"
        version: "59"
      })

      @sandbox.stub(system, "info").resolves({
        osCpus: 1
        osName: 2
        osMemory: 3
        osVersion: 4
      })

      @sandbox.stub(api, "createRun").resolves()

    it "calls api.createRun with the right args", ->
      browser = "chrome"
      key = "recordKey"
      projectId = "pId123"
      specPattern = ["spec/pattern1", "spec/pattern2"]
      projectRoot = "project/root"
      runAllSpecs = @sandbox.stub()

      recordMode.createRunAndRecordSpecs({
        key
        specs
        browser
        projectId
        projectRoot
        specPattern
        runAllSpecs
      })
      .then ->
        expect(system.info).to.be.calledOnce
        expect(commitInfo.commitInfo).to.be.calledWith(projectRoot)
        expect(browsers.getByName).to.be.calledWith(browser)
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
            sha: "sha-123",
            branch: "master",
            authorName: "brian",
            authorEmail: "brian@cypress.io",
            message: "such hax",
            remoteOrigin: "https://github.com/foo/bar.git"
          }
        })

  context ".updateInstanceStdout", ->
    beforeEach ->
      @sandbox.stub(api, "updateInstanceStdout")

    it "calls api.updateInstanceStdout", ->
      api.updateInstanceStdout.resolves()

      options = {
        instanceId: "id-123"
        captured: { toString: -> "foobarbaz\n" }
      }

      recordMode.updateInstanceStdout(options)
      .then ->
        expect(api.updateInstanceStdout).to.be.calledWith({
          instanceId: "id-123"
          stdout: "foobarbaz\n"
        })

    it "does not createException when statusCode is 503", ->
      err = new Error("foo")
      err.statusCode = 503

      @sandbox.spy(logger, "createException")

      api.updateInstanceStdout.rejects(err)

      options = {
        instanceId: "id-123"
        captured: { toString: -> "foobarbaz\n" }
      }

      recordMode.updateInstanceStdout(options)
      .then ->
        expect(logger.createException).not.to.be.called

  context.skip ".uploadAssets", ->
    beforeEach ->
      @sandbox.stub(api, "updateInstance")

    it "calls api.updateInstance", ->
      api.updateInstance.resolves()

      recordMode.uploadAssets("id-123", {
        stats: {
          tests: 1
          passes: 2
          failures: 3
          pending: 4
          duration: 5
        }
        video: "path/to/video"
        error: "err msg"
        screenshots: [{
          name: "foo"
          path: "path/to/screenshot"
        }]
        failingTests: ["foo"]
        config: {foo: "bar"}
      }, "foobarbaz")

      expect(api.updateInstance).to.be.calledWith({
        instanceId: "id-123"
        tests: 1
        passes: 2
        failures: 3
        pending: 4
        duration: 5
        error: "err msg"
        video: true
        screenshots: [{name: "foo"}]
        failingTests: ["foo"]
        cypressConfig: {foo: "bar"}
        ciProvider: "circle"
        stdout: "foobarbaz"
      })

    it "calls recordMode.upload on success", ->
      resp = {
        videoUploadUrl: "https://s3.upload.video"
        screenshotUploadUrls: [
          { clientId: 1, uploadUrl: "https://s3.upload.screenshot/1"}
          { clientId: 2, uploadUrl: "https://s3.upload.screenshot/2"}
        ]
      }

      api.updateInstance.resolves(resp)

      @sandbox.stub(upload, "send").resolves()

      recordMode.uploadAssets("id-123", {
        tests: 1
        passes: 2
        failures: 3
        pending: 4
        duration: 5
        video: "path/to/video"
        screenshots: [{
          clientId: 1
          name: "foo"
          path: "path/to/screenshot1"
        }, {
          clientId: 2
          name: "bar"
          path: "path/to/screenshot2"
        }]
        failingTests: ["foo"]
        config: {foo: "bar"}
        shouldUploadVideo: true
      })
      .then ->
        expect(upload.send.callCount).to.be.eq(3)
        expect(upload.send.firstCall).to.be.calledWith("path/to/video", "https://s3.upload.video")
        expect(upload.send.secondCall).to.be.calledWith("path/to/screenshot1", "https://s3.upload.screenshot/1")
        expect(upload.send.thirdCall).to.be.calledWith("path/to/screenshot2", "https://s3.upload.screenshot/2")

        ## reset the stub
        upload.send.reset()

        ## does not upload the video
        recordMode.uploadAssets("id-123", {
          tests: 1
          passes: 2
          failures: 3
          pending: 4
          duration: 5
          video: "path/to/video"
          screenshots: [{
            clientId: 1
            name: "foo"
            path: "path/to/screenshot1"
          }, {
            clientId: 2
            name: "bar"
            path: "path/to/screenshot2"
          }]
          failingTests: ["foo"]
          config: {foo: "bar"}
          shouldUploadVideo: false
        })
        .then ->
          expect(upload.send.callCount).to.be.eq(2)
          expect(upload.send.firstCall).to.be.calledWith("path/to/screenshot1", "https://s3.upload.screenshot/1")
          expect(upload.send.secondCall).to.be.calledWith("path/to/screenshot2", "https://s3.upload.screenshot/2")

    it "logs warning on error", ->
      err = new Error("foo")

      @sandbox.spy(errors, "warning")
      @sandbox.spy(logger, "createException")
      @sandbox.spy(console, "log")

      api.updateInstance.rejects(err)

      recordMode.uploadAssets("id-123", {})
      .then ->
        expect(errors.warning).to.be.calledWith("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)
        expect(console.log).to.be.calledWithMatch("This run will not be recorded.")
        expect(console.log).to.be.calledWithMatch("Error: foo")
        expect(logger.createException).to.be.calledWith(err)

    it "does not createException when statusCode is 503", ->
      err = new Error("foo")
      err.statusCode = 503

      @sandbox.spy(logger, "createException")

      api.updateInstance.rejects(err)

      recordMode.uploadAssets("id-123", {})
      .then ->
        expect(logger.createException).not.to.be.called

  context ".createInstance", ->
    beforeEach ->
      @sandbox.stub(api, "createInstance")

    it "calls api.createInstance", ->
      api.createInstance.resolves()

      recordMode.createInstance({
        runId: "run-123",
        planId: "plan-123"
        machineId: "machine-123"
        platform: {}
        spec: { path: "cypress/integration/app_spec.coffee" }
      })
      .then ->
        expect(api.createInstance).to.be.calledWith({
          runId: "run-123",
          planId: "plan-123"
          machineId: "machine-123"
          platform: {}
          spec: "cypress/integration/app_spec.coffee"
        })

    it "does not createException when statusCode is 503", ->
      err = new Error("foo")
      err.statusCode = 503

      @sandbox.spy(logger, "createException")

      api.createInstance.rejects(err)

      recordMode.createInstance({
        runId: "run-123",
        planId: "plan-123"
        machineId: "machine-123"
        platform: {}
        spec: { path: "cypress/integration/app_spec.coffee" }
      })
      .then (ret) ->
        expect(ret).to.be.null
        expect(logger.createException).not.to.be.called
