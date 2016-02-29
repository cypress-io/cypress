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
      @sandbox.stub(api, "createCiGuid")

    it "calls api.createCiGuid with args", ->
      api.createCiGuid.resolves()

      ci.ensureProjectAPIToken("id-123", "path/to/project", "key-123").then ->
        expect(api.createCiGuid).to.be.calledWith({
          key: "key-123"
          projectId: "id-123"
          branch: "master"
          author: "brian"
          message: "such hax"
        })

    it "handles status code errors of 401", ->
      err = new Error
      err.statusCode = 401

      api.createCiGuid.rejects(err)

      key = "3206e6d9-51b6-4766-b2a5-9d173f5158aa"

      ci.ensureProjectAPIToken("id-123", "path", key)
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

      api.createCiGuid.rejects(err)

      ci.ensureProjectAPIToken("id-123", "path", "key-123")
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) ->
        expect(err.type).to.eq("CI_PROJECT_NOT_FOUND")

    it "handles all other errors", ->
      api.createCiGuid.rejects(new Error)

      ci.ensureProjectAPIToken()
      .then ->
        throw new Error("should have failed but did not")
      .catch (err) ->
        expect(err.type).to.eq("CI_CANNOT_COMMUNICATE")

  context ".run", ->
    beforeEach ->
      @sandbox.stub(ci, "ensureCi").resolves()
      @sandbox.stub(ci, "ensureProjectAPIToken").resolves("guid-abc")
      @sandbox.stub(Project, "add").resolves()
      @sandbox.stub(Project, "id").resolves("id-123")
      @sandbox.stub(headless, "run").resolves()

    it "ensures ci", ->
      ci.run({}).then ->
        expect(ci.ensureCi).to.be.calledOnce

    it "adds project with projectPath", ->
      ci.run({projectPath: "path/to/project"}).then ->
        expect(Project.add).to.be.calledWith("path/to/project")

    it "gets project id by path", ->
      ci.run({projectPath: "path/to/project"}).then ->
        expect(Project.id).to.be.calledWith("path/to/project")

    it "passes id + projectPath + options.key to ensureProjectAPIToken", ->
      ci.run({projectPath: "path/to/project", key: "key-foo"}).then ->
        expect(ci.ensureProjectAPIToken).to.be.calledWith("id-123", "path/to/project", "key-foo")

    it "calls headless.run + passes ci_guid into options", ->
      opts = {foo: "bar"}
      ci.run(opts).then ->
        expect(headless.run).to.be.calledWith({foo: "bar", ci_guid: "guid-abc"})