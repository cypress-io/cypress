require("../../spec_helper")

os         = require("os")
api        = require("#{root}../lib/api")
stdout     = require("#{root}../lib/stdout")
errors     = require("#{root}../lib/errors")
logger     = require("#{root}../lib/logger")
Project    = require("#{root}../lib/project")
terminal   = require("#{root}../lib/util/terminal")
ci         = require("#{root}../lib/modes/ci")
headless   = require("#{root}../lib/modes/headless")
git        = require("#{root}../lib/util/git")
ciProvider = require("#{root}../lib/util/ci_provider")

describe "electron/ci", ->
  beforeEach ->
    @sandbox.stub(ciProvider, "name").returns("circle")
    @sandbox.stub(ciProvider, "params").returns({foo: "bar"})
    @sandbox.stub(ciProvider, "buildNum").returns("build-123")

  context ".getBranch", ->
    beforeEach ->
      @repo = @sandbox.stub({
        getBranch: ->
      })

    afterEach ->
      delete process.env.CIRCLE_BRANCH
      delete process.env.TRAVIS_BRANCH
      delete process.env.CI_BRANCH

    it "gets branch from process.env.CIRCLE_BRANCH", ->
      process.env.CIRCLE_BRANCH = "bem/circle"
      process.env.TRAVIS_BRANCH = "bem/travis"
      process.env.CI_BRANCH     = "bem/ci"

      ci.getBranch(@repo).then (ret) ->
        expect(ret).to.eq("bem/circle")

    it "gets branch from process.env.TRAVIS_BRANCH", ->
      process.env.TRAVIS_BRANCH = "bem/travis"
      process.env.CI_BRANCH     = "bem/ci"

      ci.getBranch(@repo).then (ret) ->
        expect(ret).to.eq("bem/travis")

    it "gets branch from process.env.CI_BRANCH", ->
      process.env.CI_BRANCH     = "bem/ci"

      ci.getBranch(@repo).then (ret) ->
        expect(ret).to.eq("bem/ci")

    it "gets branch from git", ->
      @repo.getBranch.resolves("regular-branch")

      ci.getBranch(@repo).then (ret) ->
        expect(ret).to.eq("regular-branch")

  context ".generateProjectBuildId", ->
    beforeEach ->
      @sandbox.stub(git, "_getBranch").resolves("master")
      @sandbox.stub(git, "_getAuthor").resolves("brian")
      @sandbox.stub(git, "_getEmail").resolves("brian@cypress.io")
      @sandbox.stub(git, "_getMessage").resolves("such hax")
      @sandbox.stub(git, "_getSha").resolves("sha-123")
      @sandbox.stub(git, "_getRemoteOrigin").resolves("https://github.com/foo/bar.git")
      @sandbox.stub(api, "createBuild")

    it "calls api.createBuild with args", ->
      api.createBuild.resolves()

      ci.generateProjectBuildId("id-123", "path/to/project", "project", "key-123").then ->
        expect(api.createBuild).to.be.calledWith({
          projectId: "id-123"
          projectToken: "key-123"
          commitSha: "sha-123"
          commitBranch: "master"
          commitAuthorName: "brian"
          commitAuthorEmail: "brian@cypress.io"
          commitMessage: "such hax"
          remoteOrigin: "https://github.com/foo/bar.git"
          ciProvider: "circle"
          ciBuildNum: "build-123"
          ciParams: {foo: "bar"}
        })

    it "handles status code errors of 401", ->
      err = new Error
      err.statusCode = 401

      api.createBuild.rejects(err)

      key = "3206e6d9-51b6-4766-b2a5-9d173f5158aa"

      ci.generateProjectBuildId("id-123", "path", "project", key)
        .then ->
          throw new Error("should have failed but did not")
        .catch (err) ->
          expect(err.type).to.eq("CI_KEY_NOT_VALID")
          expect(err.message).to.include("key")
          expect(err.message).to.include("3206e...158aa")
          expect(err.message).to.include("invalid")

    it "handles status code errors of 404", ->
      err = new Error
      err.statusCode = 404

      api.createBuild.rejects(err)

      ci.generateProjectBuildId("id-123", "path", "project", "key-123")
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) ->
        expect(err.type).to.eq("CI_PROJECT_NOT_FOUND")

    it "handles all other errors", ->
      err = new Error("foo")

      api.createBuild.rejects(err)

      @sandbox.spy(errors, "warning")
      @sandbox.spy(logger, "createException")
      @sandbox.spy(console, "log")

      ## this should not throw
      ci.generateProjectBuildId(1,2,3,4)
      .then (ret) ->
        expect(ret).to.be.null
        expect(errors.warning).to.be.calledWith("CI_CANNOT_CREATE_BUILD_OR_INSTANCE", err)
        expect(console.log).to.be.calledWithMatch("Warning: We encountered an error talking to our servers.")
        expect(console.log).to.be.calledWithMatch("Error: foo")
        expect(logger.createException).to.be.calledWith(err)

  context ".uploadStdout", ->
    beforeEach ->
      @sandbox.stub(api, "updateInstanceStdout")

    it "calls api.updateInstanceStdout", ->
      api.updateInstanceStdout.resolves()

      ci.uploadStdout("id-123", "foobarbaz\n")

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

      ci.uploadStdout("id-123", "asdf")
      .then ->
        expect(errors.warning).to.be.calledWith("CI_CANNOT_CREATE_BUILD_OR_INSTANCE", err)
        expect(console.log).to.be.calledWithMatch("No build assets will be recorded.")
        expect(console.log).to.be.calledWithMatch("Error: foo")
        expect(logger.createException).to.be.calledWith(err)

    it "does not createException when statusCode is 503", ->
      err = new Error("foo")
      err.statusCode = 503

      @sandbox.spy(logger, "createException")

      api.updateInstanceStdout.rejects(err)

      ci.uploadStdout("id-123", "Asdfasd")
      .then ->
        expect(logger.createException).not.to.be.called

  context ".uploadAssets", ->
    beforeEach ->
      @sandbox.stub(api, "updateInstance")

    it "calls api.updateInstance", ->
      api.updateInstance.resolves()

      ci.uploadAssets("id-123", {
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

    it "calls ci.upload on success", ->
      resp = {
        videoUploadUrl: "https://s3.upload.video"
        screenshotUploadUrls: [
          { clientId: 1, uploadUrl: "https://s3.upload.screenshot/1"}
          { clientId: 2, uploadUrl: "https://s3.upload.screenshot/2"}
        ]
      }

      api.updateInstance.resolves(resp)

      @sandbox.stub(ci, "upload").resolves()

      ci.uploadAssets("id-123", {
        tests: 1
        passes: 2
        failures: 3
        pending: 4
        duration: 5
        video: "path/to/video"
        screenshots: [{
          name: "foo"
          path: "path/to/screenshot"
        }]
        failingTests: ["foo"]
        config: {foo: "bar"}
      })
      .then ->
        expect(ci.upload).to.be.calledWith({
          video: "path/to/video"
          screenshots: [{
            name: "foo"
            path: "path/to/screenshot"
          }]
          videoUrl: resp.videoUploadUrl
          screenshotUrls: resp.screenshotUploadUrls
        })

    it "logs warning on error", ->
      err = new Error("foo")

      @sandbox.spy(errors, "warning")
      @sandbox.spy(logger, "createException")
      @sandbox.spy(console, "log")

      api.updateInstance.rejects(err)

      ci.uploadAssets("id-123", {})
      .then ->
        expect(errors.warning).to.be.calledWith("CI_CANNOT_CREATE_BUILD_OR_INSTANCE", err)
        expect(console.log).to.be.calledWithMatch("No build assets will be recorded.")
        expect(console.log).to.be.calledWithMatch("Error: foo")
        expect(logger.createException).to.be.calledWith(err)

    it "does not createException when statusCode is 503", ->
      err = new Error("foo")
      err.statusCode = 503

      @sandbox.spy(logger, "createException")

      api.updateInstance.rejects(err)

      ci.uploadAssets("id-123", {})
      .then ->
        expect(logger.createException).not.to.be.called

  context ".createInstance", ->
    beforeEach ->
      @sandbox.stub(api, "createInstance")

    it "calls api.createInstance", ->
      api.createInstance.resolves()

      ci.createInstance("id-123", "cypress/integration/app_spec.coffee")

      expect(api.createInstance).to.be.calledWith({
        buildId: "id-123"
        spec: "cypress/integration/app_spec.coffee"
      })

    it "logs warning on error", ->
      err = new Error("foo")

      @sandbox.spy(errors, "warning")
      @sandbox.spy(logger, "createException")
      @sandbox.spy(console, "log")

      api.createInstance.rejects(err)

      ci.createInstance("id-123", null)
      .then (ret) ->
        expect(ret).to.be.null
        expect(errors.warning).to.be.calledWith("CI_CANNOT_CREATE_BUILD_OR_INSTANCE", err)
        expect(console.log).to.be.calledWithMatch("No build assets will be recorded.")
        expect(console.log).to.be.calledWithMatch("Error: foo")
        expect(logger.createException).to.be.calledWith(err)

    it "does not createException when statusCode is 503", ->
      err = new Error("foo")
      err.statusCode = 503

      @sandbox.spy(logger, "createException")

      api.createInstance.rejects(err)

      ci.createInstance("id-123", null)
      .then (ret) ->
        expect(ret).to.be.null
        expect(logger.createException).not.to.be.called

  context ".run", ->
    beforeEach ->
      @sandbox.stub(ci, "generateProjectBuildId").resolves("build-id-123")
      @sandbox.stub(ci, "createInstance").resolves("instance-id-123")
      @sandbox.stub(ci, "uploadAssets").resolves()
      @sandbox.stub(ci, "uploadStdout").resolves()
      @sandbox.stub(Project, "id").resolves("id-123")
      @sandbox.stub(Project, "config").resolves({projectName: "projectName"})
      @sandbox.stub(headless, "run").resolves({tests: 2, passes: 1})
      @sandbox.spy(Project, "add")

    it "ensures id", ->
      ci.run({projectPath: "path/to/project"})
      .then ->
        expect(Project.id).to.be.calledWith("path/to/project")

    it "adds project with projectPath", ->
      ci.run({projectPath: "path/to/project"})
      .then ->
        expect(Project.add).to.be.calledWith("path/to/project")

    it "passes id + projectPath + options.key to generateProjectBuildId", ->
      ci.run({projectPath: "path/to/project", key: "key-foo"})
      .then ->
        expect(ci.generateProjectBuildId).to.be.calledWith("id-123", "path/to/project", "projectName", "key-foo")

    it "passes buildId + options.spec to createInstance", ->
      ci.run({spec: "foo/bar/spec"})
      .then ->
        expect(ci.createInstance).to.be.calledWith("build-id-123", "foo/bar/spec")

    it "does not call ci.createInstance or ci.uploadAssets when no buildId", ->
      ci.generateProjectBuildId.resolves(null)

      ci.run({})
      .then (stats) ->
        expect(ci.createInstance).not.to.be.called
        expect(ci.uploadAssets).not.to.be.called

        expect(stats).to.deep.eq({
          tests: 2
          passes: 1
        })

    it "calls headless.run + ensureAuthToken + allDone into options", ->
      opts = {foo: "bar"}

      ci.run(opts)
      .then ->
        expect(headless.run).to.be.calledWith({foo: "bar", ensureAuthToken: false, allDone: false})

    it "calls uploadAssets with instanceId, stats, and stdout", ->
      @sandbox.stub(stdout, "capture").returns({
        toString: -> "foobarbaz"
      })

      ci.run({})
      .then ->
        expect(ci.uploadAssets).to.be.calledWith("instance-id-123", {tests: 2, passes: 1}, "foobarbaz")

    it "does not call uploadAssets with no instanceId", ->
      ci.createInstance.resolves(null)

      ci.run({})
      .then (stats) ->
        expect(ci.uploadAssets).not.to.be.called

        expect(stats).to.deep.eq({
          tests: 2
          passes: 1
        })

    it "does not call uploadStdout with no instanceId", ->
      ci.createInstance.resolves(null)

      ci.run({})
      .then (stats) ->
        expect(ci.uploadStdout).not.to.be.called

    it "does not call uploadStdout on uploadAssets failure", ->
      ci.uploadAssets.restore()
      @sandbox.stub(api, "updateInstance").rejects(new Error)

      ci.run({})
      .then (stats) ->
        expect(ci.uploadStdout).not.to.be.called

    it "calls ci.uploadStdout on uploadAssets success", ->
      @sandbox.stub(stdout, "capture").returns({
        toString: -> "foobarbaz"
      })

      ci.run({})
      .then (stats) ->
        expect(ci.uploadStdout).to.be.calledWith("instance-id-123", "foobarbaz")

    it "captures stdout from headless.run and headless.allDone", ->
      fn = ->
        console.log("foo")
        console.log("bar")
        process.stdout.write("baz")

        Promise.resolve({failures: 0})

      headless.run.restore()
      @sandbox.stub(headless, "run", fn)

      ci.run({})
      .then (stats) ->
        str = ci.uploadStdout.getCall(0).args[1]

        expect(str).to.include("foo\nbar\nbaz")
        expect(str).to.include("All Done")

    it "calls headless.allDone on uploadAssets success", ->
      @sandbox.spy(terminal, "header")

      ci.run({})
      .then (stats) ->
        expect(terminal.header).to.be.calledWith("All Done")

        expect(stats).to.deep.eq({
          tests: 2
          passes: 1
        })

    it "calls headless.allDone on uploadAssets failure", ->
      @sandbox.spy(terminal, "header")
      @sandbox.stub(api, "updateInstance").rejects(new Error)
      ci.uploadAssets.restore()

      ci.run({})
      .then (stats) ->
        expect(terminal.header).to.be.calledWith("All Done")

        expect(stats).to.deep.eq({
          tests: 2
          passes: 1
        })

    it "calls headless.allDone on createInstance failure", ->
      @sandbox.spy(terminal, "header")
      ci.createInstance.resolves(null)

      ci.run({})
      .then (stats) ->
        expect(terminal.header).to.be.calledWith("All Done")

        expect(stats).to.deep.eq({
          tests: 2
          passes: 1
        })
