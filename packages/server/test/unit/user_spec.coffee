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

  context ".logIn", ->
    it "sets user to cache + returns user", ->
      obj = {name: "brian"}
      sinon.stub(api, "createSignin").withArgs("abc-123").resolves(obj)
      sinon.spy(cache, "setUser")

      user.logIn("abc-123").then (ret) ->
        expect(ret).to.deep.eq(obj)
        expect(cache.setUser).to.be.calledWith(obj)

  context ".logOut", ->
    it "calls api.createSignout + removes the session from cache", ->
      sinon.stub(api, "createSignout").withArgs("abc-123").resolves()
      sinon.stub(cache, "getUser").resolves({name: "brian", authToken: "abc-123"})
      sinon.spy(cache, "removeUser")

      user.logOut().then ->
        expect(cache.removeUser).to.be.calledOnce

    it "does not send to api.createSignout without a authToken", ->
      sinon.spy(api, "createSignout")
      sinon.stub(cache, "getUser").resolves({name: "brian"})
      sinon.spy(cache, "removeUser")

      user.logOut().then ->
        expect(api.createSignout).not.to.be.called
        expect(cache.removeUser).to.be.calledOnce

    it "removes the session from cache even if api.createSignout rejects", ->
      sinon.stub(api, "createSignout").withArgs("abc-123").rejects(new Error("ECONNREFUSED"))
      sinon.stub(cache, "getUser").resolves({name: "brian", authToken: "abc-123"})
      sinon.spy(cache, "removeUser")

      user.logOut().catch ->
        expect(cache.removeUser).to.be.calledOnce

  context ".getLoginUrl", ->
    it "calls api.getLoginUrl", ->
      sinon.stub(api, "getLoginUrl").resolves("https://github.com/login")

      user.getLoginUrl().then (url) ->
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
