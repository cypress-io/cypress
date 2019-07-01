require("../spec_helper")

api    = require("#{root}lib/api")
cache  = require("#{root}lib/cache")
user   = require("#{root}lib/user")
errors = require("#{root}lib/errors")

describe "lib/user", ->
  context ".get", ->
    it "calls cache.getUser", ->
      sinon.stub(cache, "getUser").resolves({name: "brian"})

      user.get().then (user) ->
        expect(user).to.deep.eq({name: "brian"})

  context ".logOut", ->
    it "calls api.createLogout + removes the session from cache", ->
      sinon.stub(api, "createLogout").withArgs("abc-123").resolves()
      sinon.stub(cache, "getUser").resolves({name: "brian", authToken: "abc-123"})
      sinon.spy(cache, "removeUser")

      user.logOut().then ->
        expect(cache.removeUser).to.be.calledOnce

    it "does not send to api.createLogout without a authToken", ->
      sinon.spy(api, "createLogout")
      sinon.stub(cache, "getUser").resolves({name: "brian"})
      sinon.spy(cache, "removeUser")

      user.logOut().then ->
        expect(api.createLogout).not.to.be.called
        expect(cache.removeUser).to.be.calledOnce

    it "removes the session from cache even if api.createLogout rejects", ->
      sinon.stub(api, "createLogout").withArgs("abc-123").rejects(new Error("ECONNREFUSED"))
      sinon.stub(cache, "getUser").resolves({name: "brian", authToken: "abc-123"})
      sinon.spy(cache, "removeUser")

      user.logOut().catch ->
        expect(cache.removeUser).to.be.calledOnce

  context ".syncProfile", ->
    it "calls api.getMe then saves user to cache", ->
      sinon.stub(api, "getMe").resolves({
        name: 'foo'
        email: 'bar@baz'
      })
      sinon.stub(cache, "setUser").resolves()

      user.syncProfile("foo-123", "bar-456")
      .then ->
        expect(api.getMe).to.be.calledWith("foo-123")
        expect(cache.setUser).to.be.calledWith({
          authToken: "foo-123"
          name: "foo"
          email: "bar@baz"
        })

  context ".getBaseLoginUrl", ->
    it "calls api.getAuthUrls", ->
      sinon.stub(api, "getAuthUrls").resolves({
        "dashboardAuthUrl": "https://github.com/login"
      })

      user.getBaseLoginUrl().then (url) ->
        expect(url).to.eq("https://github.com/login")

  context ".ensureAuthToken", ->
    it "returns authToken", ->
      sinon.stub(cache, "getUser").resolves({name: "brian", authToken: "abc-123"})

      user.ensureAuthToken().then (st) ->
        expect(st).to.eq("abc-123")

    it "throws NOT_LOGGED_IN when no authToken, tagged as api error", ->
      sinon.stub(cache, "getUser").resolves(null)

      user.ensureAuthToken()
      .then ->
        throw new Error("should have thrown an error")
      .catch (err) ->
        expectedErr = errors.get("NOT_LOGGED_IN")
        expect(err.message).to.eq(expectedErr.message)
        expect(err.isApiError).to.be.true
        expect(err.type).to.eq(expectedErr.type)
