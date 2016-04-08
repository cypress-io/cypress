require("../../spec_helper")

os       = require("os")
api      = require("#{root}../lib/api")
Project  = require("#{root}../lib/project")
ci       = require("#{root}../lib/modes/ci")
headless = require("#{root}../lib/modes/headless")

describe "electron/ci", ->
  context ".getBranchFromGit", ->
    beforeEach ->
      @repo = @sandbox.stub({
        branchAsync: ->
      })

    it "returns branch name", ->
      @repo.branchAsync.resolves({name: "foo"})

      ci.getBranchFromGit(@repo).then (ret) ->
        expect(ret).to.eq("foo")

    it "returns '' on err", ->
      @repo.branchAsync.rejects(new Error("bar"))

      ci.getBranchFromGit(@repo).then (ret) ->
        expect(ret).to.eq("")

  context ".getMessage", ->
    beforeEach ->
      @repo = @sandbox.stub({
        current_commitAsync: ->
      })

    it "returns branch name", ->
      @repo.current_commitAsync.resolves({message: "hax"})

      ci.getMessage(@repo).then (ret) ->
        expect(ret).to.eq("hax")

    it "returns '' on err", ->
      @repo.current_commitAsync.rejects(new Error("bar"))

      ci.getMessage(@repo).then (ret) ->
        expect(ret).to.eq("")

  context ".getAuthor", ->
    beforeEach ->
      @repo = @sandbox.stub({
        current_commitAsync: ->
      })

    it "returns branch name", ->
      @repo.current_commitAsync.resolves({
        author: {
          name: "brian"
        }
      })

      ci.getAuthor(@repo).then (ret) ->
        expect(ret).to.eq("brian")

    it "returns '' on err", ->
      @repo.current_commitAsync.rejects(new Error("bar"))

      ci.getAuthor(@repo).then (ret) ->
        expect(ret).to.eq("")

  context ".getBranch", ->
    beforeEach ->
      @repo = @sandbox.stub({
        branchAsync: ->
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
      @repo.branchAsync.resolves({name: "regular-branch"})

      ci.getBranch(@repo).then (ret) ->
        expect(ret).to.eq("regular-branch")

  context ".ensureCi", ->
    it "returns when os.platform is linux", ->
      @sandbox.stub(os, "platform").returns("linux")

      ci.ensureCi()

    it "throws when os.platform isnt linux", ->
      @sandbox.stub(os, "platform").returns("darwin")

      ci.ensureCi()
        .then ->
          throw new Error("should have errored but did not")
        .catch (err) ->
          expect(err.type).to.eq("NOT_CI_ENVIRONMENT")

  context ".ensureProjectAPIToken", ->
    beforeEach ->
      @sandbox.stub(ci, "getBranch").resolves("master")
      @sandbox.stub(ci, "getAuthor").resolves("brian")
      @sandbox.stub(ci, "getMessage").resolves("such hax")
      @sandbox.stub(api, "createCi")

    it "calls api.createCi with args", ->
      api.createCi.resolves()

      ci.ensureProjectAPIToken("id-123", "path/to/project", "project", "key-123").then ->
        expect(api.createCi).to.be.calledWith({
          key: "key-123"
          projectId: "id-123"
          projectName: "project"
          branch: "master"
          author: "brian"
          message: "such hax"
        })

    it "handles status code errors of 401", ->
      err = new Error
      err.statusCode = 401

      api.createCi.rejects(err)

      key = "3206e6d9-51b6-4766-b2a5-9d173f5158aa"

      ci.ensureProjectAPIToken("id-123", "path", "project", key)
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

      api.createCi.rejects(err)

      ci.ensureProjectAPIToken("id-123", "path", "project", "key-123")
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) ->
        expect(err.type).to.eq("CI_PROJECT_NOT_FOUND")

    it "handles all other errors", ->
      api.createCi.rejects(new Error)

      ci.ensureProjectAPIToken(1,2,3,4)
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) ->
        expect(err.type).to.eq("CI_CANNOT_COMMUNICATE")

  context ".reportStats", ->
    beforeEach ->
      @sandbox.stub(api, "updateCi")

    it "calls api.updateCi", ->
      api.updateCi.resolves()

      ci.reportStats("id-123", "ci-123", "project", "key-123", {passes: 1})

      expect(api.updateCi).to.be.calledWith({
        key: "key-123"
        ciId: "ci-123"
        projectId: "id-123"
        projectName: "project"
        stats: {passes: 1}
      })

    it "swallows errors", ->
      api.updateCi.rejects(new Error)

      ci.reportStats()

  context ".run", ->
    beforeEach ->
      @sandbox.stub(ci, "ensureCi").resolves()
      @sandbox.stub(ci, "ensureProjectAPIToken").resolves("guid-abc")
      @sandbox.stub(ci, "reportStats").resolves()
      @sandbox.stub(Project, "id").resolves("id-123")
      @sandbox.stub(Project, "config").resolves({projectName: "projectName"})
      @sandbox.stub(headless, "run").resolves({passes: 10, failures: 2})
      @sandbox.spy(Project, "add")

    it "ensures ci", ->
      ci.run({projectPath: "path/to/project"}).then ->
        expect(ci.ensureCi).to.be.calledOnce

    it "ensures id", ->
      ci.run({projectPath: "path/to/project"}).then ->
        expect(Project.id).to.be.calledWith("path/to/project")

    it "adds project with projectPath", ->
      ci.run({projectPath: "path/to/project"}).then ->
        expect(Project.add).to.be.calledWith("path/to/project")

    it "passes id + projectPath + options.key to ensureProjectAPIToken", ->
      ci.run({projectPath: "path/to/project", key: "key-foo"}).then ->
        expect(ci.ensureProjectAPIToken).to.be.calledWith("id-123", "path/to/project", "projectName", "key-foo")

    it "calls headless.run + ensureSession into options", ->
      opts = {foo: "bar"}
      ci.run(opts).then ->
        expect(headless.run).to.be.calledWith({foo: "bar", ensureSession: false})

    it "calls reportStats with id, ciGuid, key + stats", ->
      ci.run({key: "key-123"}).then ->
        expect(ci.reportStats).to.be.calledWith("id-123", "guid-abc", "projectName", "key-123", {passes: 10, failures: 2})

    it "returns with the stats failures", ->
      ci.run({}).then (failures) ->
        expect(failures).to.eq 2
