require("../spec_helper")

execa   = require("execa")
Promise = require("bluebird")
git     = require("#{root}/lib/util/git")

describe "lib/util/git", ->
  context ".init", ->
    it "returns factory with functions", ->
      fns = ["getBranch", "getMessage", "getEmail", "getAuthor", "getSha", "getRemoteOrigin"]

      obj = git.init(process.cwd())

      fns.forEach (fn) ->
        expect(obj[fn]).to.be.a("function")

  stubGit = (sandbox, cmd, stdout) ->
    sandbox.stub(execa, "shell")
      .withArgs(cmd)
      .resolves({ stdout })

  rejectGit = (sandbox, err) ->
    sandbox.stub(execa, "shell").rejects(err)

  # we are using "git.init().<method> in the rest of the code
  # so let's test this path
  context "._getSha", ->
    getSha = git.init().getSha

    it "returns branch sha", ->
      stubGit(@sandbox, "git show -s --pretty=%H", "sha-123")

      getSha()
      .then (ret) ->
        expect(ret).to.eq("sha-123")

    it "returns '' on err", ->
      rejectGit(@sandbox, new Error("bar"))

      getSha()
      .then (ret) ->
        expect(ret).to.eq("")

  # TODO convert the rest of the unit tests
  context.skip "._getBranch", ->
    beforeEach ->
      @repo = @sandbox.stub({
        branchAsync: ->
      })

    it "returns branch name", ->
      @repo.branchAsync.resolves({name: "foo"})

      git._getBranch(@repo).then (ret) ->
        expect(ret).to.eq("foo")

    it "returns '' on err", ->
      @repo.branchAsync.rejects(new Error("bar"))

      git._getBranch(@repo).then (ret) ->
        expect(ret).to.eq("")

  context.skip "._getMessage", ->
    beforeEach ->
      @repo = @sandbox.stub({
        current_commitAsync: ->
      })

    it "returns branch name", ->
      @repo.current_commitAsync.resolves({message: "hax"})

      git._getMessage(@repo).then (ret) ->
        expect(ret).to.eq("hax")

    it "returns '' on err", ->
      @repo.current_commitAsync.rejects(new Error("bar"))

      git._getMessage(@repo).then (ret) ->
        expect(ret).to.eq("")

  context.skip "._getAuthor", ->
    beforeEach ->
      @repo = @sandbox.stub({
        current_commitAsync: ->
      })

    it "returns author name", ->
      @repo.current_commitAsync.resolves({
        author: {
          name: "brian"
        }
      })

      git._getAuthor(@repo).then (ret) ->
        expect(ret).to.eq("brian")

    it "returns '' on err", ->
      @repo.current_commitAsync.rejects(new Error("bar"))

      git._getAuthor(@repo).then (ret) ->
        expect(ret).to.eq("")

  context.skip "._getEmail", ->
    beforeEach ->
      @repo = @sandbox.stub({
        current_commitAsync: ->
      })

    it "returns author email", ->
      @repo.current_commitAsync.resolves({
        author: {
          email: "brian@cypress.io"
        }
      })

      git._getEmail(@repo).then (ret) ->
        expect(ret).to.eq("brian@cypress.io")

    it "returns '' on err", ->
      @repo.current_commitAsync.rejects(new Error("bar"))

      git._getEmail(@repo).then (ret) ->
        expect(ret).to.eq("")

  context.skip "._getRemoteOrigin", ->
    beforeEach ->
      @repo = @sandbox.stub({
        configAsync: ->
      })

    it "returns remote origin url", ->
      @repo.configAsync.resolves({
        items: {
          'remote.origin.url': "https://github.com/foo/bar.git"
        }
      })

      git._getRemoteOrigin(@repo)
      .then (ret) ->
        expect(ret).to.eq("https://github.com/foo/bar.git")

    it "returns '' on err", ->
      @repo.configAsync.rejects(new Error("bar"))

      git._getRemoteOrigin(@repo)
      .then (ret) ->
        expect(ret).to.eq("")
