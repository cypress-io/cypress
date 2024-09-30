require('../../spec_helper')
import 'chai-as-promised'
import { expect } from 'chai'
import os from 'os'
import sinon from 'sinon'
import Foxdriver from '@benmalka/foxdriver'
import * as firefox from '../../../lib/browsers/firefox'
import firefoxUtil from '../../../lib/browsers/firefox-util'
import { CdpAutomation } from '../../../lib/browsers/cdp_automation'
import { BrowserCriClient } from '../../../lib/browsers/browser-cri-client'
import { ICriClient } from '../../../lib/browsers/cri-client'
import { GeckoDriver } from '../../../lib/browsers/geckodriver'
import * as webDriverClassicImport from '../../../lib/browsers/webdriver-classic'

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
  let foxdriver: any
  let foxdriverTab: any
  let wdcInstance: sinon.SinonStubbedInstance<webDriverClassicImport.WebDriverClassic>

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

  beforeEach(function () {
    sinon.stub(utils, 'getProfileDir').returns('/path/to/appData/firefox-stable/interactive')

    mockfs({
      '/path/to/appData/firefox-stable/interactive': {},
    })

    sinon.stub(protocol, '_connectAsync').resolves(null)

    this.browserInstance = {
      // should be high enough to not kill any real PIDs
      pid: Number.MAX_SAFE_INTEGER,
    }

    sinon.stub(GeckoDriver, 'create').resolves(this.browserInstance)

    wdcInstance = sinon.createStubInstance(webDriverClassicImport.WebDriverClassic)

    wdcInstance.createSession.resolves({
      capabilities: {
        'moz:debuggerAddress': '127.0.0.1:12345',
        acceptInsecureCerts: false,
        browserName: '',
        browserVersion: '',
        platformName: '',
        pageLoadStrategy: 'normal',
        strictFileInteractability: false,
        timeouts: {
          implicit: 0,
          pageLoad: 0,
          script: 0,
        },
        'moz:accessibilityChecks': false,
        'moz:buildID': '',
        'moz:geckodriverVersion': '',
        'moz:headless': false,
        'moz:platformVersion': '',
        'moz:processID': 0,
        'moz:profile': '',
        'moz:shutdownTimeout': 0,
        'moz:webdriverClick': false,
        'moz:windowless': false,
        unhandledPromptBehavior: '',
        userAgent: '',
        sessionId: '',
      },
    })

    sinon.stub(webDriverClassicImport, 'WebDriverClassic').callsFake(() => wdcInstance)

    stubFoxdriver()
  })

  context('#open', () => {
    beforeEach(function () {
      // majorVersion >= 86 indicates CDP support for Firefox, which provides
      // the CDP debugger URL for the after:browser:launch tests
      this.browser = { name: 'firefox', channel: 'stable', majorVersion: 100 }
      this.automation = {
        use: sinon.stub().returns({}),
      }

      this.options = {
        proxyUrl: 'http://proxy-url',
        socketIoRoute: 'socket/io/route',
        browser: this.browser,
      }

      sinon.stub(process, 'pid').value(1111)

      protocol.foo = 'bar'

      sinon.stub(plugins, 'has')
      sinon.stub(plugins, 'execute')
      sinon.stub(launch, 'launch').returns(this.browserInstance)
      sinon.stub(utils, 'writeExtension').resolves('/path/to/ext')
      sinon.stub(utils, 'getPort').resolves(1234)
      sinon.spy(FirefoxProfile.prototype, 'setPreference')
      sinon.spy(FirefoxProfile.prototype, 'updatePreferences')
      sinon.spy(FirefoxProfile.prototype, 'path')

      const browserCriClient: BrowserCriClient = sinon.createStubInstance(BrowserCriClient)

      browserCriClient.attachToTargetUrl = sinon.stub().resolves({})
      browserCriClient.getWebSocketDebuggerUrl = sinon.stub().returns('ws://debugger')
      browserCriClient.close = sinon.stub().resolves()

      sinon.stub(BrowserCriClient, 'create').resolves(browserCriClient)
      sinon.stub(CdpAutomation, 'create').resolves()
    })

    context('#connectToNewSpec', () => {
      beforeEach(function () {
        this.options.onError = () => {}
        this.options.onInitializeNewBrowserTab = sinon.stub()
      })

      it('calls connectToNewSpec in firefoxUtil', async function () {
        wdcInstance.getWindowHandles.resolves(['mock-context-id'])
        await firefox.open(this.browser, 'http://', this.options, this.automation)

        this.options.url = 'next-spec-url'
        await firefox.connectToNewSpec(this.browser, this.options, this.automation)

        expect(this.options.onInitializeNewBrowserTab).to.have.been.called
        expect(wdcInstance.getWindowHandles).to.have.been.called
        expect(wdcInstance.switchToWindow).to.have.been.calledWith('mock-context-id')

        // first time when connecting a new tab
        expect(wdcInstance.navigate).to.have.been.calledWith('about:blank')
        // second time when navigating to the spec
        expect(wdcInstance.navigate).to.have.been.calledWith('next-spec-url')
      })
    })

    it('executes before:browser:launch if registered', function () {
      plugins.has.withArgs('before:browser:launch').returns(true)
      plugins.execute.resolves(null)

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(plugins.execute).to.be.calledWith('before:browser:launch')
      })
    })

    it('does not execute before:browser:launch if not registered', function () {
      plugins.has.withArgs('before:browser:launch').returns(false)

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(plugins.execute).not.to.be.calledWith('before:browser:launch')
      })
    })

    it('uses default preferences if before:browser:launch returns falsy value', function () {
      plugins.has.withArgs('before:browser:launch').returns(true)
      plugins.execute.resolves(null)

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.type', 1)
      })
    })

    it('uses default preferences if before:browser:launch returns object with non-object preferences', function () {
      plugins.has.withArgs('before:browser:launch').returns(true)
      plugins.execute.resolves({
        preferences: [],
      })

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('network.proxy.type', 1)
      })
    })

    it('sets preferences if returned by before:browser:launch', function () {
      plugins.has.withArgs('before:browser:launch').returns(true)
      plugins.execute.resolves({
        preferences: { 'foo': 'bar' },
      })

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.setPreference).to.be.calledWith('foo', 'bar')
      })
    })

    it('creates the geckodriver, the creation of the WebDriver session, installs the extension, and passes the correct port to CDP', function () {
      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(GeckoDriver.create).to.have.been.calledWith({
          host: '127.0.0.1',
          port: sinon.match(Number),
          marionetteHost: '127.0.0.1',
          marionettePort: sinon.match(Number),
          webdriverBidiPort: sinon.match(Number),
          profilePath: '/path/to/appData/firefox-stable/interactive',
          binaryPath: undefined,
          spawnOpts: sinon.match({
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              MOZ_REMOTE_SETTINGS_DEVTOOLS: '1',
              MOZ_HEADLESS_WIDTH: '1280',
              MOZ_HEADLESS_HEIGHT: '806',
            },
          }),
        })

        expect(wdcInstance.createSession).to.have.been.calledWith(sinon.match(
          {
            capabilities: {
              alwaysMatch: {
                acceptInsecureCerts: true,
                'moz:firefoxOptions': {
                  args: [
                    '-new-instance',
                    '-start-debugger-server',
                    '-no-remote',
                    ...(os.platform() !== 'linux' ? ['-foreground'] : []),
                  ],
                },
                'moz:debuggerAddress': true,
              },
            },
          },
        ))

        expect(wdcInstance.installAddOn).to.have.been.calledWith(sinon.match({
          path: '/path/to/ext',
          temporary: true,
        }))

        expect(wdcInstance.navigate).to.have.been.calledWith('http://')

        // make sure CDP gets the expected port
        expect(BrowserCriClient.create).to.be.calledWith({ hosts: ['127.0.0.1', '::1'], port: 12345, browserName: 'Firefox', onAsynchronousError: undefined, onServiceWorkerClientEvent: undefined })
      })
    })

    it('does not maximize the browser if headless', function () {
      this.browser.isHeadless = true

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(wdcInstance.maximizeWindow).not.to.have.been.called
      })
    })

    it('does not maximize the browser if "-width" or "-height" arg is set', function () {
      this.browser.isHeadless = false
      sinon.stub(utils, 'executeBeforeBrowserLaunch').resolves({
        args: ['-width', '1280', '-height', '720'],
        extensions: [],
        preferences: {},
      })

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(wdcInstance.maximizeWindow).not.to.have.been.called
      })
    })

    it('maximizes the browser if headed and no "-width" or "-height" arg is set', function () {
      this.browser.isHeadless = false

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(wdcInstance.maximizeWindow).to.have.been.called
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
        [path.resolve(`${__dirname }../../../../../extension/dist/v2`)]: {
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

    // CDP is deprecated in Firefox 129 and up.
    // In order to enable CDP, we need to set
    // remote.active-protocol=2
    // @see https://fxdx.dev/deprecating-cdp-support-in-firefox-embracing-the-future-with-webdriver-bidi/
    // @see https://github.com/cypress-io/cypress/issues/29713
    it('sets "remote.active-protocols"=2 to keep CDP enabled for firefox versions 129 and up', function () {
      const executeBeforeBrowserLaunchSpy = sinon.spy(utils, 'executeBeforeBrowserLaunch')

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(executeBeforeBrowserLaunchSpy).to.have.been.calledWith(this.browser, sinon.match({
          preferences: {
            'remote.active-protocols': 2,
          },
        }), this.options)
      })
    })

    it('updates the preferences', function () {
      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(FirefoxProfile.prototype.updatePreferences).to.be.called
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

    it('executes after:browser:launch if registered', function () {
      plugins.has.withArgs('after:browser:launch').returns(true)
      plugins.execute.resolves(null)

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(plugins.execute).to.be.calledWith('after:browser:launch', this.browser, {
          webSocketDebuggerUrl: 'ws://debugger',
        })
      })
    })

    it('does not execute after:browser:launch if not registered', function () {
      plugins.has.withArgs('after:browser:launch').returns(false)

      return firefox.open(this.browser, 'http://', this.options, this.automation).then(() => {
        expect(plugins.execute).not.to.be.calledWith('after:browser:launch')
      })
    })

    context('returns BrowserInstance', function () {
      it('from browsers.launch', async function () {
        const instance = await firefox.open(this.browser, 'http://', this.options, this.automation)

        expect(instance).to.eq(this.browserInstance)
      })
    })
  })

  context('#connectProtocolToBrowser', () => {
    it('throws error', () => {
      expect(firefox.connectProtocolToBrowser).to.throw('Protocol is not yet supported in firefox.')
    })
  })

  context('firefox-util', () => {
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
        const criClientStub: ICriClient = {
          targetId: '',
          send: sinon.stub(),
          on: sinon.stub(),
          off: sinon.stub(),
          close: sinon.stub(),
          ws: sinon.stub() as any,
          queue: {
            enableCommands: [],
            enqueuedCommands: [],
            subscriptions: [],
          },
          closed: false,
          connected: false,
        }

        const automationStub = {
          onServiceWorkerClientEvent: sinon.stub(),
        }

        const browserCriClient: BrowserCriClient = sinon.createStubInstance(BrowserCriClient)

        browserCriClient.attachToTargetUrl = sinon.stub().resolves(criClientStub)

        sinon.stub(BrowserCriClient, 'create').resolves(browserCriClient)
        sinon.stub(CdpAutomation, 'create').resolves()

        const actual = await firefoxUtil.setupCDP(port, automationStub, null)

        expect(actual).to.equal(browserCriClient)
        expect(browserCriClient.attachToTargetUrl).to.be.calledWith('about:blank')
        expect(BrowserCriClient.create).to.be.calledWith({ hosts: ['127.0.0.1', '::1'], port, browserName: 'Firefox', onAsynchronousError: null, onServiceWorkerClientEvent: automationStub.onServiceWorkerClientEvent })
        expect(CdpAutomation.create).to.be.calledWith(
          criClientStub.send,
          criClientStub.on,
          criClientStub.off,
          browserCriClient.resetBrowserTargets,
          automationStub,
        )
      })
    })
  })
})
