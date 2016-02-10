require("../../spec_helper")

api    = require("#{root}../lib/api")
cache  = require("#{root}../lib/cache")
user   = require("#{root}../lib/electron/handlers/user")
errors = require("#{root}../lib/electron/handlers/errors")

describe "electron/user", ->
  context ".get", ->
    it "calls cache.getUser", ->
      @sandbox.stub(cache, "getUser").resolves({name: "brian"})

      user.get().then (user) ->
        expect(user).to.deep.eq({name: "brian"})

  context ".getProjectToken", ->
    it "calls cache.getProjectToken", ->
      @sandbox.stub(cache, "getProjectToken").resolves("abc-123")

      user.getProjectToken("foo", "path/to/project").then (token) ->
        expect(token).to.eq("abc-123")
        expect(cache.getProjectToken).to.be.calledWith("foo", "path/to/project")

  context ".generateProjectToken", ->
    it "calls cache.generateProjectToken", ->
      @sandbox.stub(cache, "generateProjectToken").resolves("abc-123")

      user.generateProjectToken("foo", "path/to/project").then (token) ->
        expect(token).to.eq("abc-123")
        expect(cache.generateProjectToken).to.be.calledWith("foo", "path/to/project")

  context ".logIn", ->
    it "sets user to cache + returns user", ->
      obj = {name: "brian"}
      @sandbox.stub(api, "createSignin").withArgs("abc-123").resolves(obj)
      @sandbox.spy(cache, "setUser")

      user.logIn("abc-123").then (ret) ->
        expect(ret).to.deep.eq(obj)
        expect(cache.setUser).to.be.calledWith(obj)

  context ".logOut", ->
    it "calls api.createSignout + removes the session from cache", ->
      @sandbox.stub(api, "createSignout").withArgs("abc-123").resolves()
      @sandbox.stub(cache, "getUser").resolves({name: "brian", session_token: "abc-123"})
      @sandbox.spy(cache, "removeUser")

      user.logOut().then ->
        expect(cache.removeUser).to.be.calledOnce

    it "does not send to api.createSignout without a session_token", ->
      @sandbox.spy(api, "createSignout")
      @sandbox.stub(cache, "getUser").resolves({name: "brian"})
      @sandbox.spy(cache, "removeUser")

      user.logOut().then ->
        expect(api.createSignout).not.to.be.called
        expect(cache.removeUser).to.be.calledOnce

  context ".ensureSession", ->
    it "returns session_token", ->
      @sandbox.stub(cache, "getUser").resolves({name: "brian", session_token: "abc-123"})

      user.ensureSession().then (st) ->
        expect(st).to.eq("abc-123")

    it "throws NOT_LOGGED_IN when no session_token", ->
      @sandbox.stub(cache, "getUser").resolves(null)

      user.ensureSession()
      .then ->
        throw new Error("should have thrown an error")
      .catch (err) ->
        expectedErr = errors.get("NOT_LOGGED_IN")
        expect(err.message).to.eq(expectedErr.message)
        expect(err.type).to.eq(expectedErr.type)