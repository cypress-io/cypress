require('../../spec_helper')

import 'chai-as-promised'
import { expect } from 'chai'
import { EventEmitter } from 'events'
import Marionette from 'marionette-client'
import os from 'os'
import sinon from 'sinon'
import stripAnsi from 'strip-ansi'
import Foxdriver from '@benmalka/foxdriver'
import * as firefox from '../../../lib/browsers/firefox'
import firefoxUtil from '../../../lib/browsers/firefox-util'
import { CdpAutomation } from '../../../lib/browsers/cdp_automation'
import { BrowserCriClient } from '../../../lib/browsers/browser-cri-client'
import { CriClient } from '../../../lib/browsers/cri-client'

const path = require('path')
const _ = require('lodash')
const mockfs = require('mock-fs')
const FirefoxProfile = require('firefox-profile')
const launch = require('@packages/launcher/lib/browsers')
const utils = require('../../../lib/browsers/utils')
const plugins = require('../../../lib/plugins')
const protocol = require('../../../lib/browsers/protocol')
const specUtil = require('../../specUtils')

describe('lib/browsers/firefox', () => {
  const port = 3333
  let marionetteDriver: any
  let marionetteSendCb: any
  let foxdriver: any
  let foxdriverTab: any

  const stubMarionette = () => {
    marionetteSendCb = null

    const connect = sinon.stub()

    connect.resolves()

    const send = sinon.stub().callsFake((opts) => {
      if (marionetteSendCb) {
        return marionetteSendCb(opts)
      }

      return Promise.resolve()
    })

    const close = sinon.stub()

    const socket = new EventEmitter()
    const client = new EventEmitter()

    const tcp = { socket, client }

    marionetteDriver = {
      tcp, connect, send, close,
    }

    sinon.stub(Marionette.Drivers, 'Promises').returns(marionetteDriver)
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
      on: sinon.stub(),
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
    sinon.stub(utils, 'getProfileDir').returns('/path/to/appData/firefox-stable/interactive')

    mockfs({
      '/path/to/appData/firefox-stable/interactive': {},
    })

    sinon.stub(protocol, '_connectAsync').resolves(null)

    stubMarionette()
    stubFoxdriver()
  })

  context('#connectToNewSpec', () => {
    beforeEach(function () {
      this.browser = { name: 'firefox', channel: 'stable' }
      this.automation = {
        use: sinon.stub().returns({}),
      }

      this.options = {
        onError: () => {},
      }
    })

    it('calls connectToNewSpec in firefoxUtil', function () {
      sinon.stub(firefoxUtil, 'connectToNewSpec').withArgs(50505, this.options, this.automation).resolves()

      firefox.connectToNewSpec(this.browser, this.options, this.automation)

      expect(firefoxUtil.connectToNewSpec).to.be.called
    })
  })

  context('#open', () => {
    beforeEach(function () {
      this.browser = { name: 'firefox', channel: 'stable' }
      this.automation = {
        use: sinon.stub().returns({}),
      }

      this.options = {
        proxyUrl: 'http://proxy-url',
        socketIoRoute: 'socket/io/route',
        browser: this.browser,
      }

      this.browserInstance = {
        // should be high enough to not kill any real PIDs
        pid: Number.MAX_SAFE_INTEGER,
      }

      sinon.stub(process, 'pid').value(1111)

      protocol.foo = 'bar'

      sinon.stub(plugins, 'has')
      sinon.stub(plugins, 'execute')
      sinon.stub(launch, 'launch').returns(this.browserInstance)
      sinon.stub(utils, 'writeExtension').resolves('/path/to/ext')
      sinon.spy(FirefoxProfile.prototype, 'setPreference')
      sinon.spy(FirefoxProfile.prototype, 'updatePreferences')

      return sinon.spy(FirefoxProfile.prototype, 'path')
    })

    it('executes before:browser:launch if registered', function () {
      plugins.has.returns(true)
      plugins.execute.resolves(null)

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(plugins.execute).to.be.called
      })
    })

    it('does not execute before:browser:launch if not registered', function () {
      plugins.has.returns(false)

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(plugins.execute).not.to.be.called
      })
    })

    it('uses default preferences if before:browser:launch returns falsy value', function () {
      plugins.has.returns(true)
      plugins.execute.resolves(null)

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.type', 1)
      })
    })

    it('uses default preferences if before:browser:launch returns object with non-object preferences', function () {
      plugins.has.returns(true)
      plugins.execute.resolves({
        preferences: [],
      })

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.type', 1)
      })
    })

    it('sets preferences if returned by before:browser:launch', function () {
      plugins.has.returns(true)
      plugins.execute.resolves({
        preferences: { 'foo': 'bar' },
      })

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('foo', 'bar')
      })
    })

    it('adds extensions returned by before:browser:launch, along with cypress extension', function () {
      plugins.has.returns(true)
      plugins.execute.resolves({
        extensions: ['/path/to/user/ext'],
      })

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(marionetteDriver.send).calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/ext' } })

        expect(marionetteDriver.send).calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/user/ext' } })
      })
    })

    it('adds only cypress extension if before:browser:launch returns object with non-array extensions', function () {
      plugins.has.returns(true)
      plugins.execute.resolves({
        extensions: 'not-an-array',
      })

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(marionetteDriver.send).calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/ext' } })

        expect(marionetteDriver.send).not.calledWithMatch({ name: 'Addon:Install', params: { path: '/path/to/user/ext' } })
      })
    })

    it('sets user-agent preference if specified', function () {
      this.options.userAgent = 'User Agent'

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('general.useragent.override', 'User Agent')
      })
    })

    it('writes extension', function () {
      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(utils.writeExtension).to.be.calledWith(this.options.browser, this.options.isTextTerminal, this.options.proxyUrl, this.options.socketIoRoute)
      })
    })

    it('writes extension and ensure write access', function () {
      // TODO: Test is failing locally, figure out why??
      if (!process.env.CI) {
        return
      }

      mockfs({
        [path.resolve(`${__dirname }../../../../../extension/dist`)]: {
          'background.js': mockfs.file({
            mode: 0o444,
          }),
        },
        [`${process.env.HOME }/.config/Cypress/cy/test/browsers/firefox-stable/interactive/CypressExtension`]: {
          'background.js': mockfs.file({
            content: 'abcn',
            mode: 0o444,
          }),
        },
        [path.resolve(`${__dirname }/../../extension`)]: { 'abc': 'test' },
        '/path/to/appData/firefox-stable/interactive': {
          'xulstore.json': '[foo xulstore.json]',
          'chrome': { 'userChrome.css': '[foo userChrome.css]' },
        },
      })

      utils.writeExtension.restore()

      const getFile = function (path) {
        return _.reduce(_.compact(_.split(path, '/')), (acc, item) => {
          return acc.getItem(item)
        }, mockfs.getMockRoot())
      }

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(getFile(`${process.env.HOME }/.config/Cypress/cy/test/browsers/firefox-stable/interactive/CypressExtension/background.js`).getMode()).to.be.equals(0o644)
      })
    })

    it('sets proxy-related preferences if specified', function () {
      this.options.proxyServer = 'http://proxy-server:1234'

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.http', 'proxy-server')
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.ssl', 'proxy-server')
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.http_port', 1234)
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.ssl_port', 1234)

        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.no_proxies_on')
      })
    })

    it('does not set proxy-related preferences if not specified', function () {
      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith('network.proxy.http', 'proxy-server')
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith('network.proxy.https', 'proxy-server')
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith('network.proxy.http_port', 1234)
        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith('network.proxy.https_port', 1234)

        expect(FirefoxProfile.prototype.setPreference).not.to.be.calledWith('network.proxy.no_proxies_on')
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/17896
    it('escapes the downloadsFolders path correctly when running on Windows OS', function () {
      this.options.proxyServer = 'http://proxy-server:1234'
      this.options.downloadsFolder = 'C:/Users/test/Downloads/My_Test_Downloads_Folder'
      sinon.stub(os, 'platform').returns('win32')
      const executeBeforeBrowserLaunchSpy = sinon.spy(utils, 'executeBeforeBrowserLaunch')

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(executeBeforeBrowserLaunchSpy).to.have.been.calledWith(this.browser, sinon.match({
          preferences: {
            // NOTE: sinon.match treats the string itself as a regular expression. The backslashes need to be escaped.
            'browser.download.dir': 'C:\\\\Users\\\\test\\\\Downloads\\\\My_Test_Downloads_Folder',
          },
        }), this.options)
      })
    })

    it('updates the preferences', function () {
      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.updatePreferences).to.be.called
      })
    })

    it('launches with the url and args', function () {
      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(launch.launch).to.be.calledWith(this.browser, 'about:blank', undefined, [
          '-marionette',
          '-new-instance',
          '-foreground',
          '-start-debugger-server',
          '-no-remote',
          '-profile',
          '/path/to/appData/firefox-stable/interactive',
        ])
      })
    })

    it('resolves the browser instance', function () {
      return firefox.open(this.browser, 'http://', this.options, this.automation).then((result) => {
        expect(result).to.equal(this.browserInstance)
      })
    })

    it('does not clear user profile if already exists', function () {
      mockfs({
        '/path/to/appData/firefox-stable/interactive/': {
          'xulstore.json': '[foo xulstore.json]',
          'chrome': { 'userChrome.css': '[foo userChrome.css]' },
        },
      })

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        // @ts-ignore
        expect(specUtil.getFsPath('/path/to/appData/firefox-stable/interactive')).containSubset({
          'xulstore.json': '[foo xulstore.json]',
          'chrome': { 'userChrome.css': '[foo userChrome.css]' },
        })
      })
    })

    it('creates xulstore.json if not exist', function () {
      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        // @ts-ignore
        expect(specUtil.getFsPath('/path/to/appData/firefox-stable/interactive')).containSubset({
          'xulstore.json': '{"chrome://browser/content/browser.xhtml":{"main-window":{"width":1280,"height":1024,"sizemode":"maximized"}}}\n',
        })
      })
    })

    it('creates chrome/userChrome.css if not exist', function () {
      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(specUtil.getFsPath('/path/to/appData/firefox-stable/interactive/chrome/userChrome.css')).ok
      })
    })

    it('clears browser cache', function () {
      mockfs({
        '/path/to/appData/firefox-stable/interactive/': {
          'CypressCache': { 'foo': 'bar' },
        },
      })

      this.options.isTextTerminal = false

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        // @ts-ignore
        expect(specUtil.getFsPath('/path/to/appData/firefox-stable/interactive')).containSubset({
          'CypressCache': {},
        })
      })
    })

    it('wraps errors when retrying socket fails', async function () {
      const err = new Error

      protocol._connectAsync.rejects()

      await expect(firefox.open(this.browser, 'http://', this.options, this.automation)).to.be.rejectedWith()
      .then((wrapperErr) => {
        expect(wrapperErr.message).to.include('Cypress failed to make a connection to Firefox.')
        expect(wrapperErr.message).to.include(err.message)
      })
    })

    context('returns BrowserInstance', function () {
      it('from browsers.launch', async function () {
        const instance = await firefox.open(this.browser, 'http://', this.options, this.automation)

        expect(instance).to.eq(this.browserInstance)
      })

      // @see https://github.com/cypress-io/cypress/issues/6392
      it('detached on Windows', async function () {
        sinon.stub(os, 'platform').returns('win32')
        const instance = await firefox.open(this.browser, 'http://', this.options, this.automation)

        expect(instance).to.not.eq(this.browserInstance)
        expect(instance.pid).to.eq(this.browserInstance.pid)

        await new Promise((resolve) => {
          // ensure events are wired as expected
          instance.on('exit', resolve)
          instance.kill()
        })
      })
    })
  })

  context('firefox-util', () => {
    context('#setupMarionette', () => {
      // @see https://github.com/cypress-io/cypress/issues/7159
      it('attaches geckodriver after testing connection', async () => {
        await firefoxUtil.setupMarionette([], '', port)

        expect(marionetteDriver.connect).to.be.calledOnce
        expect(protocol._connectAsync).to.be.calledWith({
          host: '127.0.0.1',
          port,
          getDelayMsForRetry: sinon.match.func,
        })
      })

      it('rejects on errors on socket', async () => {
        marionetteSendCb = () => {
          marionetteDriver.tcp.socket.emit('error', new Error('foo error'))

          return Promise.resolve()
        }

        await expect(firefoxUtil.setupMarionette([], '', port))
        .to.be.rejected.then((err) => {
          expect(stripAnsi(err.message)).to.include(`An unexpected error was received from Marionette: Socket`)
          expect(err.details).to.include('Error: foo error')
          expect(err.originalError.message).to.eq('foo error')
        })
      })

      it('rejects on errors from marionette commands', async () => {
        marionetteSendCb = () => {
          return Promise.reject(new Error('foo error'))
        }

        await expect(firefoxUtil.setupMarionette([], '', port))
        .to.be.rejected.then((err) => {
          expect(stripAnsi(err.message)).to.include('An unexpected error was received from Marionette: commands')
          expect(err.details).to.include('Error: foo error')
        })
      })

      it('rejects on errors during initial Marionette connection', async () => {
        marionetteDriver.connect.rejects(new Error('not connectable'))

        await expect(firefoxUtil.setupMarionette([], '', port))
        .to.be.rejected.then((err) => {
          expect(stripAnsi(err.message)).to.include('An unexpected error was received from Marionette: connection')
          expect(err.details).to.include('Error: not connectable')
        })
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

    context('#setupRemote', function () {
      it('correctly sets up the remote agent', async function () {
        const criClientStub: CriClient = {
          targetId: '',
          send: sinon.stub(),
          on: sinon.stub(),
          close: sinon.stub(),
        }

        const browserCriClient: BrowserCriClient = sinon.createStubInstance(BrowserCriClient)

        browserCriClient.attachToTargetUrl = sinon.stub().resolves(criClientStub)

        sinon.stub(BrowserCriClient, 'create').resolves(browserCriClient)
        sinon.stub(CdpAutomation, 'create').resolves()

        const actual = await firefoxUtil.setupRemote(port, null, null, { experimentalSessionAndOrigin: false })

        expect(actual).to.equal(browserCriClient)
        expect(browserCriClient.attachToTargetUrl).to.be.calledWith('about:blank')
        expect(BrowserCriClient.create).to.be.calledWith(['127.0.0.1', '::1'], port, 'Firefox', null)
        expect(CdpAutomation.create).to.be.calledWith(
          criClientStub.send,
          criClientStub.on,
          browserCriClient.resetBrowserTargets,
          null,
          false,
        )
      })
    })
  })
})
