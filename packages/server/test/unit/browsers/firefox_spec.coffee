require("../../spec_helper")

extension = require("@packages/extension")
FirefoxProfile = require("firefox-profile")
utils = require("#{root}../lib/browsers/utils")
plugins = require("#{root}../lib/plugins")
firefoxUtil = require("#{root}../lib/browsers/firefox-util")

firefox = require("#{root}../lib/browsers/firefox")

describe "lib/browsers/firefox", ->
  context "#open", ->
    beforeEach ->
      @options = {
        proxyUrl: "http://proxy-url"
        socketIoRoute: "socket/io/route"
      }

      sinon.stub(plugins, "has")
      sinon.stub(plugins, "execute")
      sinon.stub(utils, "writeExtension").resolves("/path/to/ext")
      sinon.stub(utils, "ensureProfile").resolves("/path/to/profile")
      sinon.stub(firefoxUtil, "findRemotePort").resolves(6005)
      @firefoxClient = { installTemporaryAddon: sinon.stub().resolves() }
      sinon.stub(firefoxUtil, "connect").resolves(@firefoxClient)
      @browserInstance = {}
      sinon.stub(utils, "launch").resolves(@browserInstance)
      sinon.stub(FirefoxProfile.prototype, "setPreference")
      sinon.stub(FirefoxProfile.prototype, "updatePreferences")
      sinon.stub(FirefoxProfile.prototype, "path").returns("/path/to/profile")

    it "executes before:browser:launch if registered", ->
      plugins.has.returns(true)
      plugins.execute.resolves(null)
      firefox.open("firefox", "http://", @options).then =>
        expect(plugins.execute).to.be.called

    it "does not execute before:browser:launch if not registered", ->
      plugins.has.returns(false)
      firefox.open("firefox", "http://", @options).then =>
        expect(plugins.execute).not.to.be.called

    it "uses default preferences if before:browser:launch returns falsy value", ->
      plugins.has.returns(true)
      plugins.execute.resolves(null)
      firefox.open("firefox", "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.type", 1)

    it "uses default preferences if before:browser:launch returns object with non-object preferences", ->
      plugins.has.returns(true)
      plugins.execute.resolves({
        preferences: []
      })
      firefox.open("firefox", "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.type", 1)

    it "sets preferences if returned by before:browser:launch", ->
      plugins.has.returns(true)
      plugins.execute.resolves({
        preferences: { "foo": "bar" }
      })
      firefox.open("firefox", "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("foo", "bar")

    it "adds extensions returned by before:browser:launch, along with cypress extension", ->
      plugins.has.returns(true)
      plugins.execute.resolves({
        extensions: ["/path/to/user/ext"]
      })
      firefox.open("firefox", "http://", @options).then =>
        expect(@firefoxClient.installTemporaryAddon).to.be.calledWith("/path/to/user/ext")
        expect(@firefoxClient.installTemporaryAddon).to.be.calledWith("/path/to/ext")

    it "adds only cypress extension if before:browser:launch returns object with non-array extensions", ->
      plugins.has.returns(true)
      plugins.execute.resolves({
        extensions: "not-an-array"
      })
      firefox.open("firefox", "http://", @options).then =>
        expect(@firefoxClient.installTemporaryAddon).to.be.calledOnce
        expect(@firefoxClient.installTemporaryAddon).to.be.calledWith("/path/to/ext")

    it "sets user-agent preference if specified", ->
      @options.userAgent = "User Agent"
      firefox.open("firefox", "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("general.useragent.override", "User Agent")

    it "writes extension", ->
      firefox.open("firefox", "http://", @options).then =>
        expect(utils.writeExtension).to.be.calledWith(@options.proxyUrl, @options.socketIoRoute)

    it "ensures profile directory", ->
      firefox.open("firefox", "http://", @options).then =>
        expect(utils.ensureProfile).to.be.calledWith("firefox")

    it "finds remote port for firefox debugger", ->
      firefox.open("firefox", "http://", @options).then =>
        expect(firefoxUtil.findRemotePort).to.be.called

    it "sets proxy-related preferences if specified", ->
      @options.proxyServer = "http://proxy-server:1234"
      firefox.open("firefox", "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.http", "proxy-server")
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.https", "proxy-server")
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.http_port", 1234)
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.https_port", 1234)
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.no_proxies_on")

    it "does not set proxy-related preferences if not specified", ->
      firefox.open("firefox", "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith("network.proxy.http", "proxy-server")
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith("network.proxy.https", "proxy-server")
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith("network.proxy.http_port", 1234)
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith("network.proxy.https_port", 1234)
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith("network.proxy.no_proxies_on")

    it "updates the preferences", ->
      firefox.open("firefox", "http://", @options).then =>
        expect(FirefoxProfile.prototype.updatePreferences).to.be.called

    it "launches with the url and args", ->
      firefox.open("firefox", "http://", @options).then =>
        expect(utils.launch).to.be.calledWith("firefox", "http://", [
          "-profile"
          "/path/to/profile"
          "-start-debugger-server"
          "6005"
          "-new-instance"
          "-foreground"
        ])

    it "connects to firefox debugger client and install extension", ->
      firefox.open("firefox", "http://", @options).then =>
        expect(firefoxUtil.connect).to.be.calledWith(6005)
        expect(@firefoxClient.installTemporaryAddon).to.be.calledWith("/path/to/ext")

    it "resolves the browser instance", ->
      firefox.open("firefox", "http://", @options).then (result) =>
        expect(result).to.equal(@browserInstance)
