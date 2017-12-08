require("../../spec_helper")

os         = require("os")
R          = require("ramda")
api        = require("#{root}../lib/api")
stats      = require("#{root}../lib/stats")
stdout     = require("#{root}../lib/stdout")
errors     = require("#{root}../lib/errors")
logger     = require("#{root}../lib/logger")
upload     = require("#{root}../lib/upload")
Project    = require("#{root}../lib/project")
terminal   = require("#{root}../lib/util/terminal")
record     = require("#{root}../lib/modes/record")
headless   = require("#{root}../lib/modes/headless")
ciProvider = require("#{root}../lib/util/ci_provider")
commitInfo = require("@cypress/commit-info")
snapshot   = require("snap-shot-it")

initialEnv = R.clone(process.env)

describe "lib/modes/record", ->
  beforeEach ->
    @sandbox.stub(ciProvider, "name").returns("circle")
    @sandbox.stub(ciProvider, "params").returns({foo: "bar"})
    @sandbox.stub(ciProvider, "buildNum").returns("build-123")

  context "commitInfo.getBranch", ->
    beforeEach ->
      delete process.env.CIRCLE_BRANCH
      delete process.env.TRAVIS_BRANCH
      delete process.env.BUILDKITE_BRANCH
      delete process.env.CI_BRANCH

    afterEach ->
      process.env = R.clone(initialEnv)

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

    it "gets branch from git", ->
      # this is tested inside @cypress/commit-info

  context ".generateProjectBuildId", ->
    projectSpecs = ["spec.js"]
    beforeEach ->
      @sandbox.stub(commitInfo, "commitInfo").resolves({
        branch: "master",
        author: "brian",
        email: "brian@cypress.io",
        message: "such hax",
        sha: "sha-123",
        remote: "https://github.com/foo/bar.git"
      })
      @sandbox.stub(api, "createRun")
      @sandbox.stub(Project, "findSpecs").resolves(projectSpecs)

    it "passes list of found specs", ->
      api.createRun.resolves()
      record.generateProjectBuildId("id-123", "/_test-output/path/to/project", "project", "key-123", null, null, null, projectSpecs).then ->
        specs = api.createRun.firstCall.args[0].specs
        expect(specs).to.eq(projectSpecs)

    it "calls api.createRun with args", ->
      api.createRun.resolves()

      record.generateProjectBuildId("id-123", "/_test-output/path/to/project", "project", "key-123", null, null, null, projectSpecs).then ->
        snapshot(api.createRun.firstCall.args)

    it "passes groupId", ->
      api.createRun.resolves()

      group = true
      groupId = "gr123"
      record.generateProjectBuildId("id-123", "/_test-output/path/to/project", "project", "key-123", group, groupId, null, projectSpecs).then ->
        snapshot(api.createRun.firstCall.args)

    it "warns group flag is missing if only groupId is passed", ->
      @sandbox.spy(console, "log")

      api.createRun.resolves()

      groupId = "gr123"
      record.generateProjectBuildId("id-123", "/_test-output/path/to/project", "project", "key-123", false, groupId).then ->
        msg = "Warning: you passed group-id but no group flag"
        expect(console.log).to.have.been.calledWith(msg)

    it "figures out groupId from CI environment variables", ->
      @sandbox.stub(ciProvider, "groupId").returns("ci-group-123")

      api.createRun.resolves()

      group = true
      record.generateProjectBuildId("id-123", "/_test-output/path/to/project", "project", "key-123", group, null, null, projectSpecs).then ->
        snapshot(api.createRun.firstCall.args)

    it "handles status code errors of 401", ->
      err = new Error
      err.statusCode = 401

      api.createRun.rejects(err)

      key = "3206e6d9-51b6-4766-b2a5-9d173f5158aa"

      record.generateProjectBuildId("id-123", "path", "project", key)
        .then ->
          throw new Error("should have failed but did not")
        .catch (err) ->
          expect(err.type).to.eq("RECORD_KEY_NOT_VALID")
          expect(err.message).to.include("Key")
          expect(err.message).to.include("3206e...158aa")
          expect(err.message).to.include("invalid")

    it "handles status code errors of 404", ->
      err = new Error
      err.statusCode = 404

      api.createRun.rejects(err)

      record.generateProjectBuildId("id-123", "path", "project", "key-123")
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) ->
        expect(err.type).to.eq("DASHBOARD_PROJECT_NOT_FOUND")

    it "handles all other errors", ->
      err = new Error("foo")

      api.createRun.rejects(err)

      @sandbox.spy(errors, "warning")
      @sandbox.spy(logger, "createException")
      @sandbox.spy(console, "log")

      ## this should not throw
      record.generateProjectBuildId(1,2,3,4)
      .then (ret) ->
        expect(ret).to.be.null
        expect(errors.warning).to.be.calledWith("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)
        expect(console.log).to.be.calledWithMatch("Warning: We encountered an error talking to our servers.")
        expect(console.log).to.be.calledWithMatch("Error: foo")
        expect(logger.createException).to.be.calledWith(err)

  context ".uploadStdout", ->
    beforeEach ->
      @sandbox.stub(api, "updateInstanceStdout")

    it "calls api.updateInstanceStdout", ->
      api.updateInstanceStdout.resolves()

      record.uploadStdout("id-123", "foobarbaz\n")

      expect(api.updateInstanceStdout).to.be.calledWith({
        instanceId: "id-123"
        stdout: "foobarbaz\n"
      })

    it "logs warning on error", ->
      err = new Error("foo")

      @sandbox.spy(errors, "warning")
      @sandbox.spy(logger, "createException")
      @sandbox.spy(console, "log")

      api.updateInstanceStdout.rejects(err)

      record.uploadStdout("id-123", "asdf")
      .then ->
        expect(errors.warning).to.be.calledWith("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)
        expect(console.log).to.be.calledWithMatch("This run will not be recorded.")
        expect(console.log).to.be.calledWithMatch("Error: foo")
        expect(logger.createException).to.be.calledWith(err)

    it "does not createException when statusCode is 503", ->
      err = new Error("foo")
      err.statusCode = 503

      @sandbox.spy(logger, "createException")

      api.updateInstanceStdout.rejects(err)

      record.uploadStdout("id-123", "Asdfasd")
      .then ->
        expect(logger.createException).not.to.be.called

  context ".uploadAssets", ->
    beforeEach ->
      @sandbox.stub(api, "updateInstance")

    it "calls api.updateInstance", ->
      api.updateInstance.resolves()

      record.uploadAssets("id-123", {
        tests: 1
        passes: 2
        failures: 3
        pending: 4
        duration: 5
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

    it "calls record.upload on success", ->
      resp = {
        videoUploadUrl: "https://s3.upload.video"
        screenshotUploadUrls: [
          { clientId: 1, uploadUrl: "https://s3.upload.screenshot/1"}
          { clientId: 2, uploadUrl: "https://s3.upload.screenshot/2"}
        ]
      }

      api.updateInstance.resolves(resp)

      @sandbox.stub(upload, "send").resolves()

      record.uploadAssets("id-123", {
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
        record.uploadAssets("id-123", {
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

      record.uploadAssets("id-123", {})
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

      record.uploadAssets("id-123", {})
      .then ->
        expect(logger.createException).not.to.be.called

  context ".createInstance", ->
    beforeEach ->
      @sandbox.stub(api, "createInstance")

    it "calls api.createInstance", ->
      api.createInstance.resolves()

      record.createInstance("id-123", "cypress/integration/app_spec.coffee", "FooBrowser")

      expect(api.createInstance).to.be.calledWith({
        buildId: "id-123"
        browser: "FooBrowser"
        spec: "cypress/integration/app_spec.coffee"
        machineId: undefined
      })

    it "logs warning on error", ->
      err = new Error("foo")

      @sandbox.spy(errors, "warning")
      @sandbox.spy(logger, "createException")
      @sandbox.spy(console, "log")

      api.createInstance.rejects(err)

      record.createInstance("id-123", null)
      .then (ret) ->
        expect(ret).to.be.null
        expect(errors.warning).to.be.calledWith("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err)
        expect(console.log).to.be.calledWithMatch("This run will not be recorded.")
        expect(console.log).to.be.calledWithMatch("Error: foo")
        expect(logger.createException).to.be.calledWith(err)

    it "does not createException when statusCode is 503", ->
      err = new Error("foo")
      err.statusCode = 503

      @sandbox.spy(logger, "createException")

      api.createInstance.rejects(err)

      record.createInstance("id-123", null)
      .then (ret) ->
        expect(ret).to.be.null
        expect(logger.createException).not.to.be.called

  context ".run", ->
    mockStats = stats.create({tests: 2, passes: 1})
    beforeEach ->
      @sandbox.stub(record, "generateProjectBuildId").resolves("build-id-123")
      @sandbox.stub(record, "createInstance").resolves({instanceId: "instance-id-123"})
      @sandbox.stub(record, "uploadAssets").resolves()
      @sandbox.stub(record, "uploadStdout").resolves()
      @sandbox.stub(Project, "id").resolves("id-123")
      @sandbox.stub(Project, "findSpecsFromProjectConfig").resolves(["spec.js"])
      @sandbox.stub(Project, "config").resolves({
        projectName: "projectName"
        projectRoot: "/foo/bar",
        integrationFolder: "/foo/bar/cypress/integration"
      })
      @sandbox.stub(headless, "run").resolves(mockStats)
      @sandbox.spy(Project, "add")

    it "ensures id", ->
      record.run({projectPath: "/_test-output/path/to/project"})
      .then ->
        expect(Project.id).to.be.calledWith("/_test-output/path/to/project")

    it "adds project with projectPath", ->
      record.run({projectPath: "/_test-output/path/to/project"})
      .then ->
        expect(Project.add).to.be.calledWith("/_test-output/path/to/project")

    it "passes id + projectPath + options.key to generateProjectBuildId", ->
      record.run({projectPath: "/_test-output/path/to/project", key: "key-foo"})
      .then ->
        expect(record.generateProjectBuildId).to.be.calledWith("id-123", "/_test-output/path/to/project", "projectName", "key-foo")

    it "passes buildId + options.spec to createInstance", ->
      record.run({spec: "foo/bar/spec"})
      .then ->
        expect(record.createInstance).to.be.calledWith("build-id-123", "spec.js", null)

    it "does not call record.createInstance or record.uploadAssets when no buildId", ->
      record.generateProjectBuildId.resolves(null)

      record.run({})
      .then (stats) ->
        expect(record.createInstance).not.to.be.called
        expect(record.uploadAssets).not.to.be.called

        expect(stats).to.deep.eq(mockStats)

    it "calls headless.run + ensureAuthToken + allDone into options", ->
      opts = {foo: "bar"}

      record.run(opts)
      .then ->
        expect(headless.run).to.be.calledWith({
          projectId: "id-123",
          foo: "bar",
          ensureAuthToken: false,
          allDone: false,
          spec: "/foo/bar/cypress/integration/spec.js"
        })

    it "calls uploadAssets with instanceId, stats, and stdout", ->
      @sandbox.stub(stdout, "capture").returns({
        toString: -> "foobarbaz"
      })

      record.run({})
      .then ->
        expect(record.uploadAssets).to.be.calledWith(
          "instance-id-123", stats.create({tests: 2, passes: 1}), "foobarbaz")

    it "does not call uploadAssets with no instanceId", ->
      record.createInstance.resolves(null)

      record.run({})
      .then (stats) ->
        expect(record.uploadAssets).not.to.be.called

        expect(stats).to.deep.eq(mockStats)

    it "does not call uploadStdout with no instanceId", ->
      record.createInstance.resolves(null)

      record.run({})
      .then (stats) ->
        expect(record.uploadStdout).not.to.be.called

    it "does not call uploadStdout on uploadAssets failure", ->
      record.uploadAssets.restore()
      @sandbox.stub(api, "updateInstance").rejects(new Error)

      record.run({})
      .then (stats) ->
        expect(record.uploadStdout).not.to.be.called

    it "calls record.uploadStdout on uploadAssets success", ->
      @sandbox.stub(stdout, "capture").returns({
        toString: -> "foobarbaz"
      })

      record.run({})
      .then (stats) ->
        expect(record.uploadStdout).to.be.calledWith("instance-id-123", "foobarbaz")

    it "captures stdout from headless.run and headless.allDone", ->
      fn = ->
        console.log("foo")
        console.log("bar")
        process.stdout.write("baz")

        Promise.resolve(stats.create({failures: 0}))

      headless.run.restore()
      @sandbox.stub(headless, "run", fn)

      record.run({})
      .then (stats) ->
        console.log('stats')
        console.log(stats)
        expect(record.uploadStdout).to.have.been.called
        str = record.uploadStdout.getCall(0).args[1]

        expect(str).to.include("foo\nbar\nbaz")
        expect(str).to.include("All Done")

    it "calls headless.allDone on uploadAssets success", ->
      @sandbox.spy(terminal, "header")

      record.run({})
      .then (stats) ->
        expect(terminal.header).to.be.calledWith("All Done")

        expect(stats).to.deep.eq(mockStats)

    it "calls headless.allDone on uploadAssets failure", ->
      @sandbox.spy(terminal, "header")
      @sandbox.stub(api, "updateInstance").rejects(new Error)
      record.uploadAssets.restore()

      record.run({})
      .then (stats) ->
        expect(terminal.header).to.be.calledWith("All Done")

        expect(stats).to.deep.eq(mockStats)

    it "calls headless.allDone on createInstance failure", ->
      @sandbox.spy(terminal, "header")
      record.createInstance.resolves(null)

      record.run({})
      .then (stats) ->
        expect(terminal.header).to.be.calledWith("All Done")

        expect(stats).to.deep.eq(mockStats)
