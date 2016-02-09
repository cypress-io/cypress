require("../../spec_helper")

api   = require("#{root}../lib/api")
cache = require("#{root}../lib/cache")
user  = require("#{root}../lib/electron/handlers/user")

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
