require('../../spec_helper')

import { expect } from 'chai'
import sinon from 'sinon'
import 'chai-as-promised'

const appData = require('../../../lib/util/app_data')

sinon.stub(appData, 'path').returns('/path/to/appData')

const mockfs = require('mock-fs')
import Marionette from 'marionette-client'
import Foxdriver from '@benmalka/foxdriver'
const FirefoxProfile = require('firefox-profile')

const utils = require('../../../lib/browsers/utils')
const plugins = require('../../../lib/plugins')
const protocol = require('../../../lib/browsers/protocol')
const specUtil = require('../../specUtils')

import firefoxUtil from '../../../lib/browsers/firefox-util'
import * as firefox from '../../../lib/browsers/firefox'
import { EventEmitter } from 'events'

describe('lib/browsers/firefox', () => {
  const port = 3333
  let marionetteDriver: any
  let marionetteSendCb: any
  let foxdriver: any
  let foxdriverTab: any

  const stubMarionette = () => {
    marionetteSendCb = null

    const connect = sinon.stub().callsArg(0)

    const send = sinon.stub().callsFake((opts, cb) => {
      if (marionetteSendCb) {
        return marionetteSendCb(opts, cb)
      }

      return cb({})
    })

    const close = sinon.stub()

    const socket = new EventEmitter()
    const client = new EventEmitter()

    marionetteDriver = {
      socket, client, connect, send, close,
    }

    sinon.stub(Marionette.Drivers, 'Tcp').returns(marionetteDriver)
  }

  const stubFoxdriver = () => {
    foxdriverTab = {
      data: '',
      memory: {
        isAttached: false,
        getState: sinon.stub().resolves(),
        attach: sinon.stub().resolves(),
        on: sinon.stub(),
        forceGarbageCollection: sinon.stub().resolves(),
        forceCycleCollection: sinon.stub().resolves(),
      },
    }

    const browser = {
      listTabs: sinon.stub().resolves([foxdriverTab]),
      request: sinon.stub().withArgs('listTabs').resolves({ tabs: [foxdriverTab] }),
    }

    foxdriver = {
      browser,
    }

    sinon.stub(Foxdriver, 'attach').resolves(foxdriver)
  }

  afterEach(() => {
    return mockfs.restore()
  })

  beforeEach(() => {
    sinon.stub(protocol, '_connectAsync').resolves(null)

    stubMarionette()
    stubFoxdriver()
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

      sinon.stub(plugins, 'has')
      sinon.stub(plugins, 'execute')
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
        expect(marionetteDriver.send).calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/ext' } })

        expect(marionetteDriver.send).calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/user/ext' } })
      })
    })

    it('adds only cypress extension if before:browser:launch returns object with non-array extensions', function () {
      plugins.has.returns(true)
      plugins.execute.resolves({
        extensions: 'not-an-array',
      })

      return firefox.open(this.browser, 'http://', this.options).then(() => {
        expect(marionetteDriver.send).calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/ext' } })

        expect(marionetteDriver.send).not.calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/user/ext' } })
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
        // expect(firefoxUtil.findRemotePort).to.be.called
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
        expect(utils.launch).to.be.calledWith(this.browser, 'about:blank', [
          '-marionette',
          '-new-instance',
          '-foreground',
          '-start-debugger-server',
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
        // @ts-ignore
        expect(specUtil.getFsPath('/path/to/appData/firefox/interactive')).containSubset({
          'xulstore.json': '[foo xulstore.json]',
          'chrome': { 'userChrome.css': '[foo userChrome.css]' },
        })
      })
    })

    it('creates xulstore.json if not exist', function () {
      return firefox.open(this.browser, 'http://', this.options).then(() => {
        // @ts-ignore
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
        // @ts-ignore
        expect(specUtil.getFsPath('/path/to/appData/firefox/interactive')).containSubset({
          'CypressCache': {},
        })
      })
    })
  })

  context('firefox-util', () => {
    context('#setupMarionette', () => {
      it('rejects on errors on socket', async () => {
        marionetteSendCb = () => {
          marionetteDriver.socket.emit('error', new Error('foo error'))
        }

        await expect(firefoxUtil.setupMarionette([], '', port))
        .to.be.rejectedWith('Unexpected error from Marionette Socket: Error: foo error')
      })

      it('rejects on errors from marionette commands', async () => {
        marionetteSendCb = (opts, cb) => {
          cb({ error: true })
        }

        await expect(firefoxUtil.setupMarionette([], '', port))
        .to.be.rejectedWith('Unexpected error from Marionette commands: GenericError')
      })
    })

    context('#setupFoxdriver', () => {
      it('attaches foxdriver after testing connection', async () => {
        await firefoxUtil.setupFoxdriver(port)

        expect(Foxdriver.attach).to.be.calledWith('127.0.0.1', port)
        expect(protocol._connectAsync).to.be.calledWith({
          host: '127.0.0.1',
          port,
          getDelayMsForRetry: sinon.match.func,
        })
      })

      it('sets the collectGarbage callback which can be used to force GC+CC', async () => {
        await firefoxUtil.setupFoxdriver(port)

        const { memory } = foxdriverTab

        expect(memory.forceCycleCollection).to.not.be.called
        expect(memory.forceGarbageCollection).to.not.be.called

        await firefoxUtil.collectGarbage()

        expect(memory.forceCycleCollection).to.be.calledOnce
        expect(memory.forceGarbageCollection).to.be.calledOnce

        await firefoxUtil.collectGarbage()

        expect(memory.forceCycleCollection).to.be.calledTwice
        expect(memory.forceGarbageCollection).to.be.calledTwice
      })
    })
  })
})
