require('../../spec_helper')

const appData = require(`${root}../lib/util/app_data`)

sinon.stub(appData, 'path').returns('/path/to/appData')

const mockfs = require('mock-fs')
const Marionette = require('marionette-client')
const Foxdriver = require('@benmalka/foxdriver')
const FirefoxProfile = require('firefox-profile')

const utils = require(`${root}../lib/browsers/utils`)
const plugins = require(`${root}../lib/plugins`)
const protocol = require(`${root}../lib/browsers/protocol`)
const specUtil = require('../../specUtils')
const firefoxUtil = require(`${root}../lib/browsers/firefox-util`).default

const firefox = require(`${root}../lib/browsers/firefox`)

describe('lib/browsers/firefox', () => {
  afterEach(() => {
    return mockfs.restore()
  })

  context('#open', () => {
    beforeEach(function () {
      mockfs({
        '/path/to/appData': {},
      })

      this.browser = { name: 'firefox' }
      this.options = {
        proxyUrl: 'http://proxy-url',
        socketIoRoute: 'socket/io/route',
        browser: this.browser,
      }

      sinon.stub(process, 'pid').value(1111)

      protocol.foo = 'bar'
      sinon.stub(protocol, '_connectAsync').resolves(null)

      sinon.stub(Foxdriver, 'attach').resolves({ listTabs () {
        return []
      } })

      sinon.stub(plugins, 'has')
      sinon.stub(plugins, 'execute')
      sinon.stub(Marionette.Drivers.Tcp.prototype, 'connect').yields(null)
      sinon.stub(Marionette.Drivers.Tcp.prototype, 'send').yields({ sessionId: 'fooSessionId' })
      sinon.stub(utils, 'writeExtension').resolves('/path/to/ext')
      this.browserInstance = {}
      sinon.stub(utils, 'launch').resolves(this.browserInstance)
      sinon.spy(FirefoxProfile.prototype, 'setPreference')
      sinon.spy(FirefoxProfile.prototype, 'updatePreferences')

      return sinon.spy(FirefoxProfile.prototype, 'path')
    }) //.returns("/path/to/profile")

    it('executes before:browser:launch if registered', function () {
      plugins.has.returns(true)
      plugins.execute.resolves(null)

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(plugins.execute).to.be.called
      })
    })

    it('does not execute before:browser:launch if not registered', function () {
      plugins.has.returns(false)

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(plugins.execute).not.to.be.called
      })
    })

    it('uses default preferences if before:browser:launch returns falsy value', function () {
      plugins.has.returns(true)
      plugins.execute.resolves(null)

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.type', 1)
      })
    })

    it('uses default preferences if before:browser:launch returns object with non-object preferences', function () {
      plugins.has.returns(true)
      plugins.execute.resolves({
        preferences: [],
      })

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.type', 1)
      })
    })

    it('sets preferences if returned by before:browser:launch', function () {
      plugins.has.returns(true)
      plugins.execute.resolves({
        preferences: { 'foo': 'bar' },
      })

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('foo', 'bar')
      })
    })

    it('adds extensions returned by before:browser:launch, along with cypress extension', function () {
      plugins.has.returns(true)
      plugins.execute.resolves({
        extensions: ['/path/to/user/ext'],
      })

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(Marionette.Drivers.Tcp.prototype.send).calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/ext' } })

        expect(Marionette.Drivers.Tcp.prototype.send).calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/user/ext' } })
      })
    })

    it('adds only cypress extension if before:browser:launch returns object with non-array extensions', function () {
      plugins.has.returns(true)
      plugins.execute.resolves({
        extensions: 'not-an-array',
      })

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(Marionette.Drivers.Tcp.prototype.send).calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/ext' } })

        expect(Marionette.Drivers.Tcp.prototype.send).not.calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/user/ext' } })
      })
    })

    it('sets user-agent preference if specified', function () {
      this.options.userAgent = 'User Agent'

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('general.useragent.override', 'User Agent')
      })
    })

    it('writes extension', function () {
      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(utils.writeExtension).to.be.calledWith(this.options.browser, this.options.isTextTerminal, this.options.proxyUrl, this.options.socketIoRoute, this.options.onScreencastFrame)
      })
    })

    // TODO: pick open port for debugger
    it.skip('finds remote port for firefox debugger', function () {
      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(firefoxUtil.findRemotePort).to.be.called
      })
    })

    it('sets proxy-related preferences if specified', function () {
      this.options.proxyServer = 'http://proxy-server:1234'

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.http', 'proxy-server')
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.ssl', 'proxy-server')
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.http_port', 1234)
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.ssl_port', 1234)

        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.no_proxies_on')
      })
    })

    it('does not set proxy-related preferences if not specified', function () {
      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith('network.proxy.http', 'proxy-server')
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith('network.proxy.https', 'proxy-server')
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith('network.proxy.http_port', 1234)
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith('network.proxy.https_port', 1234)

        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith('network.proxy.no_proxies_on')
      })
    })

    it('updates the preferences', function () {
      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(FirefoxProfile.prototype.updatePreferences).to.be.called
      })
    })

    it('launches with the url and args', function () {
      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(utils.launch).to.be.calledWith(this.browser, null, [
          '-marionette',
          '-new-instance',
          '-foreground',
          '-start-debugger-server',
          '2929',
          '-profile',
          '/path/to/appData/firefox/interactive',
        ])
      })
    })

    it('resolves the browser instance', function () {
      return firefox.open(this.browser, 'http://', this.options).then((result) => {
        expect(result).to.equal(this.browserInstance)
      })
    })

    it('does not clear user profile if already exists', function () {
      mockfs({
        '/path/to/appData/firefox/interactive/': {
          'xulstore.json': '[foo xulstore.json]',
          'chrome': { 'userChrome.css': '[foo userChrome.css]' },
        },
      })

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(specUtil.getFsPath('/path/to/appData/firefox/interactive')).containSubset({
          'xulstore.json': '[foo xulstore.json]',
          'chrome': { 'userChrome.css': '[foo userChrome.css]' },
        })
      })
    })

    it('creates xulstore.json if not exist', function () {
      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(specUtil.getFsPath('/path/to/appData/firefox/interactive')).containSubset({
          'xulstore.json': '{"chrome://browser/content/browser.xhtml":{"main-window":{"width":1280,"height":720,"sizemode":"maximized"}}}\n',
        })
      })
    })

    it('creates chrome/userChrome.css if not exist', function () {
      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(specUtil.getFsPath('/path/to/appData/firefox/interactive/chrome/userChrome.css')).ok
      })
    })

    it('clears browser cache', function () {
      mockfs({
        '/path/to/appData/firefox/interactive/': {
          'CypressCache': { 'foo': 'bar' },
        },
      })

      this.options.isTextTerminal = false

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(specUtil.getFsPath('/path/to/appData/firefox/interactive')).containSubset({
          'CypressCache': {},
        })
      })
    })
  })
})
