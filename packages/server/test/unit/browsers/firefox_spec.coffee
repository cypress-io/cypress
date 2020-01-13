require("../../spec_helper")

appData = require("#{root}../lib/util/app_data")
sinon.stub(appData, 'path').returns('/path/to/appData')

mockfs = require('mock-fs')
Marionette = require('marionette-client')
Foxdriver = require('@benmalka/foxdriver')
FirefoxProfile = require("firefox-profile")

utils = require("#{root}../lib/browsers/utils")
plugins = require("#{root}../lib/plugins")
protocol = require("#{root}../lib/browsers/protocol")
specUtil = require('../../specUtils')
extension = require("@packages/extension")
firefoxUtil = require("#{root}../lib/browsers/firefox-util")

firefox = require("#{root}../lib/browsers/firefox")

describe "lib/browsers/firefox", ->
  afterEach ->
    mockfs.restore()
  context "#open", ->
    beforeEach ->
      mockfs({
        '/path/to/appData': {}
      })

      @browser = { name: 'firefox' }
      @options = {
        proxyUrl: "http://proxy-url"
        socketIoRoute: "socket/io/route"
        browser: @browser
      }

      sinon.stub(process, 'pid').value(1111)
      sinon.stub(protocol, '_connectAsync').resolves(null)

      sinon.stub(Foxdriver, 'attach').resolves({listTabs: -> []})

      sinon.stub(plugins, "has")
      sinon.stub(plugins, "execute")
      sinon.stub(Marionette.Drivers.Tcp.prototype, 'connect').yields(null)
      sinon.stub(Marionette.Drivers.Tcp.prototype, 'send').yields({sessionId: 'fooSessionId'})
      sinon.stub(utils, "writeExtension").resolves("/path/to/ext")
      @browserInstance = {}
      sinon.stub(utils, "launch").resolves(@browserInstance)
      sinon.spy(FirefoxProfile.prototype, "setPreference")
      sinon.spy(FirefoxProfile.prototype, "updatePreferences")
      sinon.spy(FirefoxProfile.prototype, "path") #.returns("/path/to/profile")

    it "executes before:browser:launch if registered", ->
      plugins.has.returns(true)
      plugins.execute.resolves(null)
      firefox.open(@browser, "http://", @options).then =>
        expect(plugins.execute).to.be.called

    it "does not execute before:browser:launch if not registered", ->
      plugins.has.returns(false)
      firefox.open(@browser, "http://", @options).then =>
        expect(plugins.execute).not.to.be.called

    it "uses default preferences if before:browser:launch returns falsy value", ->
      plugins.has.returns(true)
      plugins.execute.resolves(null)
      firefox.open(@browser, "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.type", 1)

    it "uses default preferences if before:browser:launch returns object with non-object preferences", ->
      plugins.has.returns(true)
      plugins.execute.resolves({
        preferences: []
      })
      firefox.open(@browser, "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.type", 1)

    it "sets preferences if returned by before:browser:launch", ->
      plugins.has.returns(true)
      plugins.execute.resolves({
        preferences: { "foo": "bar" }
      })
      firefox.open(@browser, "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("foo", "bar")

    it "adds extensions returned by before:browser:launch, along with cypress extension", ->
      plugins.has.returns(true)
      plugins.execute.resolves({
        extensions: ["/path/to/user/ext"]
      })
      firefox.open(@browser, "http://", @options).then =>
        expect(Marionette.Drivers.Tcp.prototype.send).calledWithMatch({name: 'Addon:Install', params: {path: "/path/to/ext"}})
        expect(Marionette.Drivers.Tcp.prototype.send).calledWithMatch({name: 'Addon:Install', params: {path: "/path/to/user/ext"}})

    it "adds only cypress extension if before:browser:launch returns object with non-array extensions", ->
      plugins.has.returns(true)
      plugins.execute.resolves({
        extensions: "not-an-array"
      })
      firefox.open(@browser, "http://", @options).then =>
        expect(Marionette.Drivers.Tcp.prototype.send).calledWithMatch({name: 'Addon:Install', params: {path: "/path/to/ext"}})
        expect(Marionette.Drivers.Tcp.prototype.send).not.calledWithMatch({name: 'Addon:Install', params: {path: "/path/to/user/ext"}})

    it "sets user-agent preference if specified", ->
      @options.userAgent = "User Agent"
      firefox.open(@browser, "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("general.useragent.override", "User Agent")

    it "writes extension", ->
      firefox.open(@browser, "http://", @options).then =>
        expect(utils.writeExtension).to.be.calledWith(@options.browser, @options.isTextTerminal, @options.proxyUrl, @options.socketIoRoute, @options.onScreencastFrame)

    it.skip "finds remote port for firefox debugger", ->
      firefox.open(@browser, "http://", @options).then =>
        expect(firefoxUtil.findRemotePort).to.be.called

    it "sets proxy-related preferences if specified", ->
      @options.proxyServer = "http://proxy-server:1234"
      firefox.open(@browser, "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.http", "proxy-server")
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.ssl", "proxy-server")
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.http_port", 1234)
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.ssl_port", 1234)
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith("network.proxy.no_proxies_on")

    it "does not set proxy-related preferences if not specified", ->
      firefox.open(@browser, "http://", @options).then =>
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith("network.proxy.http", "proxy-server")
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith("network.proxy.https", "proxy-server")
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith("network.proxy.http_port", 1234)
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith("network.proxy.https_port", 1234)
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith("network.proxy.no_proxies_on")

    it "updates the preferences", ->
      firefox.open(@browser, "http://", @options).then =>
        expect(FirefoxProfile.prototype.updatePreferences).to.be.called

    it "launches with the url and args", ->
      firefox.open(@browser, "http://", @options).then =>
        expect(utils.launch).to.be.calledWith(@browser, null, [
          "-marionette"
          "-new-instance"
          "-foreground",
          "-start-debugger-server"
          "2929"
          "-profile"
          "/path/to/appData/firefox/interactive"
        ])

    it "resolves the browser instance", ->
      firefox.open(@browser, "http://", @options).then (result) =>
        expect(result).to.equal(@browserInstance)

    it "does not clear user profile if already exists", ->
      mockfs({
        '/path/to/appData/firefox/interactive/': {
          'xulstore.json': '[foo xulstore.json]',
          'chrome': {'userChrome.css': '[foo userChrome.css]'}
        }
      })
      firefox.open(@browser, 'http://', @options).then ->
        expect(specUtil.getFsPath('/path/to/appData/firefox/interactive')).containSubset({
          'xulstore.json': '[foo xulstore.json]',
          'chrome': {'userChrome.css': '[foo userChrome.css]'}
        })

    it 'creates xulstore.json if not exist', ->
      firefox.open(@browser, 'http://', @options).then ->
        expect(specUtil.getFsPath('/path/to/appData/firefox/interactive')).containSubset({
          'xulstore.json': '''{"chrome://browser/content/browser.xhtml":{"main-window":{"width":1280,"height":720,"sizemode":"maximized"}}}\n''',
        })

    it 'creates chrome/userChrome.css if not exist', ->
      firefox.open(@browser, 'http://', @options).then ->
        expect(specUtil.getFsPath('/path/to/appData/firefox/interactive/chrome/userChrome.css')).ok


    it "clears browser cache", ->
      mockfs({
        '/path/to/appData/firefox/interactive/': {
          'CypressCache': {'foo': 'bar'},
        }
      })
      @options.isTextTerminal = false
      firefox.open(@browser, 'http://', @options).then ->
        expect(specUtil.getFsPath('/path/to/appData/firefox/interactive')).containSubset({
          'CypressCache': {}
        })
