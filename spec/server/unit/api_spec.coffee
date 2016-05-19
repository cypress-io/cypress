require("../spec_helper")

_        = require("lodash")
rp       = require("request-promise")
os       = require("os")
pkg      = require("#{root}package.json")
api      = require("#{root}lib/api")
Promise  = require("bluebird")
provider = require("#{root}lib/util/provider")

describe "lib/api", ->
  beforeEach ->
    @sandbox.stub(os, "platform").returns("linux")
    @sandbox.stub(provider, "get").returns("circle")

  context ".createCi", ->
    it "POST /ci/:id + returns ci_guid", ->
      nock("http://localhost:1234")
      .post("/ci/project-123", {
        "x-project-token": "guid"
        "x-project-name": "foobar"
        "x-git-branch": "master"
        "x-git-author": "brian"
        "x-git-message": "such hax"
        "x-version": pkg.version
        "x-platform": "linux"
        "x-provider": "circle"
      })
      .reply(200, {
        ci_guid: "new_ci_guid"
      })

      api.createCi({
        key: "guid"
        branch: "master"
        author: "brian"
        message: "such hax"
        projectId: "project-123"
        projectName: "foobar"
      })
      .then (ret) ->
        expect(ret).to.eq("new_ci_guid")

  context ".updateCi", ->
    it "PUTS /ci/:id", ->
      nock("http://localhost:1234")
      .put("/ci/project-123", {
        tests: 3
        passes: 1
        failures: 2
        "x-ci-id": "ci-123"
        "x-project-token": "key-123"
        "x-project-name": "foobar"
        "x-version": pkg.version
        "x-platform": "linux"
        "x-provider": "circle"
      })
      .reply(200)

      api.updateCi({
        key: "key-123"
        ciId: "ci-123"
        projectId: "project-123"
        projectName: "foobar"
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
      .post("/signin", {
        "x-version": pkg.version
        "x-platform": "linux"
      })
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
      .post("/signout", {
        "x-session": "abc-123"
        "x-version": pkg.version
        "x-platform": "linux"
      })
      .reply(200)

      api.createSignout("abc-123")

  context ".createProject", ->
    it "POSTs /projects", ->
      nock("http://localhost:1234")
      .post("/projects", {
        "x-session": "session-123"
        "x-platform": "linux"
        "x-project-name": "foobar"
        "x-version": pkg.version
      })
      .reply(200, {
        uuid: "uuid-123"
      })

      api.createProject("foobar", "session-123").then (uuid) ->
        expect(uuid).to.eq("uuid-123")

  context ".updateProject", ->
    it "GETs /projects/:id", ->
      nock("http://localhost:1234")
      .get("/projects/project-123", {
        "x-session": "session-123"
        "x-platform": "linux"
        "x-type": "opened"
        "x-version": pkg.version
        "x-project-name": "foobar"
      })
      .reply(200, {})

      api.updateProject("project-123", "opened", "foobar", "session-123").then (resp) ->
        expect(resp).to.deep.eq({})

  context ".sendUsage", ->
    it "POSTs /user/usage", ->
      nock("http://localhost:1234")
      .post("/user/usage", {
        "x-session": "session-123"
        "x-runs": 5
        "x-example": true
        "x-all": false
        "x-version": pkg.version
        "x-platform": "linux"
        "x-project-name": "admin"
      })
      .reply(200)

      api.sendUsage(5, true, false, "admin", "session-123")

  context ".getProjectToken", ->
    it "GETs /projects/:id/token", ->
      nock("http://localhost:1234")
      .get("/projects/project-123/token", {
        "x-session": "session-123"
      })
      .reply(200, {
        api_token: "token-123"
      })

      api.getProjectToken("project-123", "session-123")
      .then (resp) ->
        expect(resp).to.eq("token-123")

  context ".updateProjectToken", ->
    it "PUTs /projects/:id/token", ->
      nock("http://localhost:1234")
      .put("/projects/project-123/token", {
        "x-session": "session-123"
      })
      .reply(200, {
        api_token: "token-123"
      })

      api.updateProjectToken("project-123", "session-123")
      .then (resp) ->
        expect(resp).to.eq("token-123")

  context ".createRaygunException", ->
    beforeEach ->
      @setup = (body, session, delay = 0) ->
        nock("http://localhost:1234")
        .post("/exceptions", _.extend({}, body, {
          "x-session": session
        }))
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
