require("../spec_helper")

api = require("#{root}lib/api")

describe "lib/api", ->
  context ".createCiGuid", ->
    it "POST /ci/:id + returns ci_guid", ->
      nock("http://localhost:1234", {
        reqheaders: {
          "x-project-token": "guid"
          "x-git-branch": "master"
          "x-git-author": "brian"
          "x-git-message": "such hax"
        }
      })
      .post("/ci/project-123")
      .reply(200, {
        ci_guid: "new_ci_guid"
      })

      api.createCiGuid({
        key: "guid"
        branch: "master"
        author: "brian"
        message: "such hax"
        projectId: "project-123"
      })
      .then (ret) ->
        expect(ret).to.eq("new_ci_guid")

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
      nock("http://localhost:1234", {
        reqheaders: {
          "X-Session": "abc-123"
        }
      })
      .post("/signout")
      .reply(200)

      api.createSignout("abc-123")
