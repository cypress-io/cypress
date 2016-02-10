require("../../spec_helper")

cookies = require("#{root}../lib/electron/handlers/cookies")

cookiesStub = {
  remove: (url, name, cb) ->
    cb(null, null)

  get: (options, cb) ->
    cb(null, [])
}

cookiesArray = [
  {
    name: 'logged_in',
    value: 'yes',
    domain: '.github.com',
    hostOnly: false,
    path: '/foo',
    secure: true,
    httpOnly: true,
    session: false
  },{
    name: 'dotcom_user',
    value: 'brian-mann',
    domain: '.github.com',
    hostOnly: false,
    path: '/',
    secure: false,
    httpOnly: true,
    session: false
  },{
    name: 'user_session',
    value: 'uA_OopUFnOUArR-ScQAxl6GNjG-ZwuBLN6afIQAnFvBX1_paVrDjxBDAYO6C_-hLeV_ZVOc2Mn5YfK3c',
    domain: 'github.com',
    hostOnly: true,
    path: '/',
    secure: true,
    httpOnly: true,
    session: false
  }
]

describe.only "electron/cookies", ->
  context ".clearGithub", ->
    it "returns null", ->
      cookies.clearGithub(cookiesStub).then (ret) ->
        expect(ret).to.be.null

    it "passes github domain to get", ->
      @sandbox.spy(cookiesStub, "get")

      cookies.clearGithub(cookiesStub).then ->
        expect(cookiesStub.get).to.be.calledWith({domain: "github.com"})

    it "removes 3 cookies", ->
      @sandbox.spy(cookiesStub, "remove")
      @sandbox.stub(cookiesStub, "get").yields(null, cookiesArray)

      cookies.clearGithub(cookiesStub).then ->
        expect(cookiesStub.remove.callCount).to.eq(3)
        expect(cookiesStub.remove.firstCall).to.be.calledWith("https://www.github.com/foo", "logged_in")
        expect(cookiesStub.remove.secondCall).to.be.calledWith("http://www.github.com/", "dotcom_user")
        expect(cookiesStub.remove.thirdCall).to.be.calledWith("https://github.com/", "user_session")

