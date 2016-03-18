require("../spec_helper")

rp       = require("request-promise")
os       = require("os")
pkg      = require("#{root}package.json")
api      = require("#{root}lib/api")
provider = require("#{root}lib/util/provider")

describe "lib/api", ->
  beforeEach ->
    @sandbox.stub(os, "platform").returns("linux")
    @sandbox.stub(provider, "get").returns("circle")

  context ".createCi", ->
    it "POST /ci/:id + returns ci_guid", ->
      nock("http://localhost:1234")
      .matchHeader("x-project-token", "guid")
      .matchHeader("x-git-branch", "master")
      .matchHeader("x-git-author", "brian")
      .matchHeader("x-git-message", "such hax")
      .matchHeader("x-version", pkg.version)
      .matchHeader("x-platform", "linux")
      .matchHeader("x-provider", "circle")
      .post("/ci/project-123")
      .reply(200, {
        ci_guid: "new_ci_guid"
      })

      api.createCi({
        key: "guid"
        branch: "master"
        author: "brian"
        message: "such hax"
        projectId: "project-123"
      })
      .then (ret) ->
        expect(ret).to.eq("new_ci_guid")

  context ".updateCi", ->
    it "PUTS /ci/:id", ->
      nock("http://localhost:1234")
      .matchHeader("x-project-token", "key-123")
      .matchHeader("x-version", pkg.version)
      .matchHeader("x-platform", "linux")
      .matchHeader("x-provider", "circle")
      .put("/ci/project-123", {
        tests: 3
        passes: 1
        failures: 2
      })
      .reply(200)

      api.updateCi({
        key: "key-123"
        ciId: "ci-123"
        projectId: "project-123"
        stats: {
          tests: 3
          passes: 1
          failures: 2
        }
      })

    it "sets timeout to 10 seconds", ->
      @sandbox.stub(rp, "put").resolves()

      api.updateCi({}).then ->
        expect(rp.put).to.be.calledWithMatch({timeout: 10000})

  context ".getLoginUrl", ->
    it "GET /v1/auth + returns the url", ->
      nock("http://localhost:1234")
      .get("/v1/auth")
      .reply(200, {
        url: "https://github.com/authorize"
      })

      api.getLoginUrl().then (url) ->
        expect(url).to.eq("https://github.com/authorize")

  context ".createSignin", ->
    it "POSTs /signin + returns user object", ->
      nock("http://localhost:1234")
      .matchHeader("x-version", pkg.version)
      .matchHeader("x-platform", "linux")
      .post("/signin")
      .query({code: "abc-123"})
      .reply(200, {
        name: "brian"
      })

      api.createSignin("abc-123").then (user) ->
        expect(user).to.deep.eq({
          name: "brian"
        })

    it "handles 401 exceptions", ->
      nock("http://localhost:1234")
      .post("/signin")
      .query({code: "abc-123"})
      .reply(401, "Your email: 'brian@gmail.com' has not been authorized.")

      api.createSignin("abc-123")
      .then ->
        throw new Error("should have thrown error")
      .catch (err) ->
        expect(err.message).to.eq("Your email: 'brian@gmail.com' has not been authorized.")

  context ".createSignout", ->
    it "POSTs /signout", ->
      nock("http://localhost:1234")
      .matchHeader("x-session", "abc-123")
      .matchHeader("x-version", pkg.version)
      .matchHeader("x-platform", "linux")
      .post("/signout")
      .reply(200)

      api.createSignout("abc-123")

  context ".createProject", ->
    it "POSTs /projects", ->
      nock("http://localhost:1234")
      .matchHeader("x-session", "session-123")
      .matchHeader("x-version", pkg.version)
      .post("/projects")
      .reply(200, {
        uuid: "uuid-123"
      })

      api.createProject("session-123").then (uuid) ->
        expect(uuid).to.eq("uuid-123")

  context ".updateProject", ->
    it "GETs /projects/:id", ->
      nock("http://localhost:1234")
      .matchHeader("x-session", "session-123")
      .matchHeader("x-platform", "linux")
      .matchHeader("x-type", "opened")
      .matchHeader("x-version", pkg.version)
      .get("/projects/project-123")
      .reply(200, {})

      api.updateProject("project-123", "opened", "session-123").then (resp) ->
        expect(resp).to.deep.eq({})

  context ".createRaygunException", ->
    beforeEach ->
      @setup = (body, session, delay = 0) ->
        nock("http://localhost:1234")
        .matchHeader("x-session", session)
        .post("/exceptions", body)
        .delayConnection(delay)
        .reply(200)

    it "POSTs /exceptions", ->
      @setup({foo: "bar"}, "abc-123")
      api.createRaygunException({foo: "bar"}, "abc-123")

    it "by default times outs after 3 seconds", ->
      ## return our own specific promise
      ## so we can spy on the timeout function
      p = Promise.resolve()
      @sandbox.spy(p, "timeout")
      @sandbox.stub(rp.Request.prototype, "promise").returns(p)

      @setup({foo: "bar"}, "abc-123")
      api.createRaygunException({foo: "bar"}, "abc-123").then ->
        expect(p.timeout).to.be.calledWith(3000)

    it "times out after exceeding timeout", (done) ->
      ## force our connection to be delayed 5 seconds
      @setup({foo: "bar"}, "abc-123", 5000)

      ## and set the timeout to only be 50ms
      api.createRaygunException({foo: "bar"}, "abc-123", 50)
      .then ->
        done("errored: it did not catch the timeout error!")
      .catch Promise.TimeoutError, ->
        done()
