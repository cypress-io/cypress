require("../../spec_helper")

extension = require("@packages/extension")
Marionette = require('marionette-client')
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
        browser: { name: 'firefox' }
      }

      sinon.stub(plugins, "has")
      sinon.stub(plugins, "execute")
      sinon.stub(Marionette.Drivers.Tcp.prototype, 'connect').yields(null)
      sinon.stub(Marionette.Drivers.Tcp.prototype, 'send').yields({sessionId: 'fooSessionId'})
      sinon.stub(utils, "writeExtension").resolves("/path/to/ext")
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
        expect(Marionette.Drivers.Tcp.prototype.send).calledWithMatch({name: 'Addon:Install', params: {path: "/path/to/ext"}})
        expect(Marionette.Drivers.Tcp.prototype.send).calledWithMatch({name: 'Addon:Install', params: {path: "/path/to/user/ext"}})

    it "adds only cypress extension if before:browser:launch returns object with non-array extensions", ->
      plugins.has.returns(true)
      plugins.execute.resolves({
        extensions: "not-an-array"
      })
      firefox.open("firefox", "http://", @options).then =>
        expect(Marionette.Drivers.Tcp.prototype.send).calledWithMatch({name: 'Addon:Install', params: {path: "/path/to/ext"}})
        expect(Marionette.Drivers.Tcp.prototype.send).not.calledWithMatch({name: 'Addon:Install', params: {path: "/path/to/user/ext"}})

    it "sets user-agent preference if specified", ->
      @options.userAgent = "User Agent"
      firefox.open("firefox", "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("general.useragent.override", "User Agent")

    it "writes extension", ->
      firefox.open("firefox", "http://", @options).then =>
        expect(utils.writeExtension).to.be.calledWith(@options.browser, @options.isTextTerminal, @options.proxyUrl, @options.socketIoRoute, @options.onScreencastFrame)

    it.skip "finds remote port for firefox debugger", ->
      firefox.open("firefox", "http://", @options).then =>
        expect(firefoxUtil.findRemotePort).to.be.called

    it "sets proxy-related preferences if specified", ->
      @options.proxyServer = "http://proxy-server:1234"
      firefox.open("firefox", "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.http", "proxy-server")
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.ssl", "proxy-server")
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.http_port", 1234)
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.ssl_port", 1234)
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
        expect(utils.launch).to.be.calledWith("firefox", null, [
          "-profile"
          "/path/to/profile"
          "-marionette"
          "-new-instance"
          "-foreground",
          "-height", "794"
          "-width", "1280"
        ])

    it "resolves the browser instance", ->
      firefox.open("firefox", "http://", @options).then (result) =>
        expect(result).to.equal(@browserInstance)
