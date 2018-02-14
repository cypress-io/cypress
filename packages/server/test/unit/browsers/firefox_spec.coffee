require("../../spec_helper")

extension = require("@packages/extension")
FirefoxProfile = require("firefox-profile")
utils = require("#{root}../lib/browsers/utils")
firefoxUtil = require("#{root}../lib/browsers/firefox-util")

firefox = require("#{root}../lib/browsers/firefox")

describe "lib/browsers/firefox", ->
  context "#open", ->
    beforeEach ->
      @options = {
        proxyUrl: "http://proxy-url"
        socketIoRoute: "socket/io/route"
      }

      @sandbox.stub(utils, "writeExtension").resolves("/path/to/ext")
      @sandbox.stub(firefoxUtil, "findRemotePort").resolves(6005)
      @firefoxClient = { installTemporaryAddon: @sandbox.stub().resolves() }
      @sandbox.stub(firefoxUtil, "connect").resolves(@firefoxClient)
      @browserInstance = {}
      @sandbox.stub(utils, "launch").resolves(@browserInstance)
      @sandbox.stub(FirefoxProfile.prototype, "setPreference")
      @sandbox.stub(FirefoxProfile.prototype, "updatePreferences")
      @sandbox.stub(FirefoxProfile.prototype, "path").returns("/path/to/profile")

    it "writes extension", ->
      firefox.open("firefox", "http://", @options).then =>
        expect(utils.writeExtension).to.be.calledWith(@options.proxyUrl, @options.socketIoRoute)

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
