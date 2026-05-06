require('../../spec_helper')

const os = require('os')
const mockfs = require('mock-fs')

const extension = require('@packages/extension')
const launch = require('@packages/launcher/lib/browsers')
const plugins = require(`../../../lib/plugins`)
const utils = require(`../../../lib/browsers/utils`).default
const chrome = require(`../../../lib/browsers/chrome`)
const { fs } = require(`../../../lib/util/fs`)
const { BrowserCriClient } = require('../../../lib/browsers/browser-cri-client')
const protocol = require(`../../../lib/browsers/protocol`)
const { expect } = require('chai')

const openOpts = {
  onError: () => {},
}

// Helper function to create consistent mock preferences for testing
const createMockDefaultPreferences = () => ({
  default: {
    fake_preference: {
      value: 'value',
    },
  },
  defaultSecure: {},
  localState: {
    fake_local_state: {
      value: 'value',
    },
  },
})

// Helper function to mock _getDefaultChromePreferences with consistent fake preferences
const mockGetDefaultChromePreferences = () => {
  return sinon.stub(chrome, '_getDefaultChromePreferences').returns(createMockDefaultPreferences())
}

describe('lib/browsers/chrome', () => {
  context('#open', () => {
    beforeEach(function () {
      // mock CRI client during testing
      this.pageCriClient = {
        send: sinon.stub().resolves(),
        Page: {
          screencastFrame: sinon.stub().returns(),
        },
        close: sinon.stub().resolves(),
        on: sinon.stub(),
      }

      this.browserCriClient = {
        attachToTargetUrl: sinon.stub().resolves(this.pageCriClient),
        close: sinon.stub().resolves(),
        getWebSocketDebuggerUrl: sinon.stub().returns('ws://debugger'),
      }

      this.automation = {
        push: sinon.stub(),
        use: sinon.stub().returns(),
      }

      // mock launched browser child process object
      this.launchedBrowser = {
        kill: sinon.stub().returns(),
      }

      this.onCriEvent = (event, data, options) => {
        this.pageCriClient.on.withArgs(event).yieldsAsync(data)

        return chrome.open({ isHeadless: true }, 'http://', { ...openOpts, ...options }, this.automation)
        .then(() => {
          this.pageCriClient.on = undefined
        })
      }

      sinon.stub(chrome, '_writeExtension').resolves('/path/to/ext')
      sinon.stub(BrowserCriClient, 'create').resolves(this.browserCriClient)
      sinon.stub(plugins, 'execute').callThrough()
      sinon.stub(launch, 'launch').resolves(this.launchedBrowser)
      sinon.stub(utils, 'getProfileDir').returns('/profile/dir')
      sinon.stub(utils, 'ensureCleanCache').resolves('/profile/dir/CypressCache')
      sinon.stub(utils, 'initializeCDP').resolves()

      this.readJson = sinon.stub(fs, 'readJson')
      this.readJson.withArgs('/profile/dir/Default/Preferences').rejects({ code: 'ENOENT' })
      this.readJson.withArgs('/profile/dir/Default/Secure Preferences').rejects({ code: 'ENOENT' })
      this.readJson.withArgs('/profile/dir/Local State').rejects({ code: 'ENOENT' })

      // port for Chrome remote interface communication
      sinon.stub(utils, 'getPort').resolves(50505)
    })

    afterEach(function () {
      mockfs.restore()
    })

    it('focuses on the page, calls CRI Page.navigate, enables Page/Network/Fetch events, and sets download behavior', function () {
      return chrome.open({ isHeadless: true }, 'http://', openOpts, this.automation)
      .then(() => {
        expect(utils.getPort).to.have.been.calledOnce // to get remote interface port

        expect(this.pageCriClient.send.callCount).to.equal(7)
        expect(this.pageCriClient.send).to.have.been.calledWith('Page.bringToFront')
        expect(this.pageCriClient.send).to.have.been.calledWith('Page.navigate')
        expect(this.pageCriClient.send).to.have.been.calledWith('Page.enable')
        expect(this.pageCriClient.send).to.have.been.calledWith('Page.setDownloadBehavior')
        expect(this.pageCriClient.send).to.have.been.calledWith('Network.enable')
        expect(this.pageCriClient.send).to.have.been.calledWith('Fetch.enable')
        expect(this.pageCriClient.send).to.have.been.calledWith('ServiceWorker.enable')

        expect(utils.initializeCDP).to.be.calledOnce
      })
    })

    it('executeBeforeBrowserLaunch is noop if before:browser:launch is not registered', function () {
      return chrome.open({ isHeadless: true }, 'http://', openOpts, this.automation)
      .then(() => {
        expect(plugins.execute).not.to.be.calledWith('before:browser:launch')
      })
    })

    it('uses default args if new args are not returned from before:browser:launch', function () {
      const args = []

      sinon.stub(chrome, '_getArgs').returns(args)
      sinon.stub(plugins, 'has').returns(true)

      plugins.execute.resolves(null)

      return chrome.open({ isHeadless: true }, 'http://', openOpts, this.automation)
      .then(() => {
        // to initialize remote interface client and prepare for true tests
        // we load the browser with blank page first
        expect(launch.launch).to.be.calledWith({ isHeadless: true }, 'about:blank', 50505, args)
      })
    })

    it('sets default window size and DPR in headless mode', function () {
      chrome._writeExtension.restore()

      return chrome.open({ isHeadless: true, majorVersion: 112 }, 'http://', openOpts, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          '--headless=new',
          '--window-size=1280,720',
          '--force-device-scale-factor=1',
        ])
      })
    })

    it('sets headless in the old style for versions lower than 112', function () {
      chrome._writeExtension.restore()

      return chrome.open({ isHeadless: true, majorVersion: 111 }, 'http://', openOpts, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          '--headless',
          '--window-size=1280,720',
          '--force-device-scale-factor=1',
        ])
      })
    })

    it('does not load extension in headless mode', function () {
      chrome._writeExtension.restore()

      return chrome.open({ isHeadless: true, majorVersion: 112 }, 'http://', openOpts, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          '--headless=new',
          '--remote-debugging-port=50505',
          '--remote-debugging-address=127.0.0.1',
          '--user-data-dir=/profile/dir',
          '--disk-cache-dir=/profile/dir/CypressCache',
        ])
      })
    })

    it('uses a custom profilePath if supplied', function () {
      chrome._writeExtension.restore()
      utils.getProfileDir.restore()

      const profilePath = '/home/foo/snap/chromium/current'
      const fullPath = `${profilePath}/Cypress/chromium-stable/interactive`

      this.readJson.withArgs(`${fullPath}/Default/Preferences`).rejects({ code: 'ENOENT' })
      this.readJson.withArgs(`${fullPath}/Default/Secure Preferences`).rejects({ code: 'ENOENT' })
      this.readJson.withArgs(`${fullPath}/Local State`).rejects({ code: 'ENOENT' })

      return chrome.open({
        isHeadless: true,
        isHeaded: false,
        profilePath,
        name: 'chromium',
        channel: 'stable',
      }, 'http://', openOpts, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          `--user-data-dir=${fullPath}`,
        ])
      })
    })

    context('when IGNORE_CHROME_PREFERENCES env is set', () => {
      let oldPref
      let writeJson

      beforeEach(function () {
        oldPref = process.env.IGNORE_CHROME_PREFERENCES
        process.env.IGNORE_CHROME_PREFERENCES = true
        this.readJson.rejects({ code: 'ENOENT' })
        writeJson = sinon.stub(fs, 'outputJson').resolves()
      })

      afterEach(() => {
        process.env.IGNORE_CHROME_PREFERENCES = oldPref
        writeJson.restore()
      })

      it('does not read or write preferences', async function () {
        chrome._writeExtension.restore()
        utils.getProfileDir.restore()

        await chrome.open({
          isHeadless: true,
          isHeaded: false,
          name: 'chromium',
          channel: 'stable',
        }, 'http://', openOpts, this.automation)

        expect(writeJson).not.to.be.called
        expect(this.readJson).not.to.be.called
      })
    })

    it('normalizes --load-extension if provided in plugin', function () {
      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve({
          args: ['--foo=bar', '--load-extension=/foo/bar/baz.js'],
        })
      })

      const pathToTheme = extension.getPathToTheme()

      return chrome.open({ isHeaded: true }, 'http://', openOpts, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          '--foo=bar',
          `--load-extension=/foo/bar/baz.js,/path/to/ext,${pathToTheme}`,
          '--user-data-dir=/profile/dir',
          '--disk-cache-dir=/profile/dir/CypressCache',
        ])
      })
    })

    it('normalizes multiple extensions from plugins', function () {
      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve({ args: ['--foo=bar', '--load-extension=/foo/bar/baz.js,/quux.js'] })
      })

      const pathToTheme = extension.getPathToTheme()

      const onWarning = sinon.stub()

      return chrome.open({ isHeaded: true }, 'http://', { onWarning, onError: () => {} }, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          '--foo=bar',
          `--load-extension=/foo/bar/baz.js,/quux.js,/path/to/ext,${pathToTheme}`,
          '--user-data-dir=/profile/dir',
          '--disk-cache-dir=/profile/dir/CypressCache',
        ])

        expect(onWarning).not.calledOnce
      })
    })

    it('warns the user if `--load-extension` is passed into branded chrome 137 and up', async function () {
      sinon.stub(console, 'log')

      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve({ args: ['--foo=bar', '--load-extension=/foo/bar/baz.js,/quux.js'] })
      })

      await chrome.open({ isHeaded: true, majorVersion: '137', name: 'chrome' }, 'http://', { onWarning: () => {}, onError: () => {} }, this.automation)

      // eslint-disable-next-line no-console
      expect(console.log).to.have.been.calledWith(sinon.match('Google Chrome v137 and higher does not allow loading extensions via --load-extension. If you need to load an extension to test with Cypress, please use Chrome for Testing, Chromium, or another Chrome variant that supports loading extensions.'))
    })

    it('warns the user if launchOptions.extensions is passed into branded chrome 137 and up', async function () {
      sinon.stub(console, 'log')

      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve({ args: ['--foo=bar'], extensions: ['/foo/bar/baz.js', '/quux.js'] })
      })

      await chrome.open({ isHeaded: true, majorVersion: '139', name: 'chrome' }, 'http://', { onWarning: () => {}, onError: () => {} }, this.automation)

      // eslint-disable-next-line no-console
      expect(console.log).to.have.been.calledWith(sinon.match('Google Chrome v137 and higher does not allow loading extensions via --load-extension. If you need to load an extension to test with Cypress, please use Chrome for Testing, Chromium, or another Chrome variant that supports loading extensions.'))
    })

    it('cleans up an unclean browser profile exit status', function () {
      this.readJson.withArgs('/profile/dir/Default/Preferences').resolves({
        profile: {
          exit_type: 'Abnormal',
          exited_cleanly: false,
        },
      })

      sinon.stub(fs, 'outputJson').resolves()

      return chrome.open({ isHeadless: true }, 'http://', openOpts, this.automation)
      .then(() => {
        expect(fs.outputJson).to.be.calledWith('/profile/dir/Default/Preferences', {
          profile: {
            exit_type: 'Normal',
            exited_cleanly: true,
          },
        })
      })
    })

    it('calls cri client close on kill', function () {
      // need a reference here since the stub will be monkey-patched
      const {
        kill,
      } = this.launchedBrowser

      return chrome.open({ isHeadless: true }, 'http://', openOpts, this.automation)
      .then(() => {
        expect(typeof this.launchedBrowser.kill).to.eq('function')

        this.launchedBrowser.kill()

        expect(this.browserCriClient.close).to.be.calledOnce
        expect(kill).to.be.calledOnce
      })
    })

    it('sends after:browser:launch with debugger url', function () {
      const args = []
      const browser = { isHeadless: true }

      sinon.stub(chrome, '_getArgs').returns(args)
      sinon.stub(plugins, 'has').returns(true)

      plugins.execute.resolves(null)

      return chrome.open(browser, 'http://', openOpts, this.automation)
      .then(() => {
        expect(plugins.execute).to.be.calledWith('after:browser:launch', browser, {
          webSocketDebuggerUrl: 'ws://debugger',
        })
      })
    })

    it('executeAfterBrowserLaunch is noop if after:browser:launch is not registered', function () {
      return chrome.open({ isHeadless: true }, 'http://', openOpts, this.automation)
      .then(() => {
        expect(plugins.execute).not.to.be.calledWith('after:browser:launch')
      })
    })

    describe('downloads', function () {
      it('pushes create:download after download begins', function () {
        const downloadData = {
          guid: '1',
          suggestedFilename: 'file.csv',
          url: 'http://localhost:1234/file.csv',
        }
        const options = { downloadsFolder: 'downloads' }

        return this.onCriEvent('Page.downloadWillBegin', downloadData, options)
        .then(() => {
          expect(this.automation.push).to.be.calledWith('create:download', {
            id: '1',
            filePath: 'downloads/file.csv',
            mime: 'text/csv',
            url: 'http://localhost:1234/file.csv',
          })
        })
      })

      it('pushes complete:download after download completes', function () {
        const downloadData = {
          guid: '1',
          state: 'completed',
        }
        const options = { downloadsFolder: 'downloads' }

        return this.onCriEvent('Page.downloadProgress', downloadData, options)
        .then(() => {
          expect(this.automation.push).to.be.calledWith('complete:download', {
            id: '1',
          })
        })
      })

      it('pushes canceled:download when download is incomplete', function () {
        const downloadData = {
          guid: '1',
          state: 'canceled',
        }
        const options = { downloadsFolder: 'downloads' }

        return this.onCriEvent('Page.downloadProgress', downloadData, options)
        .then(() => {
          expect(this.automation.push).to.be.calledWith('canceled:download', {
            id: '1',
          })
        })
      })
    })

    describe('adding header to AUT iframe request', function () {
      beforeEach(function () {
        const frameTree = {
          frameTree: {
            childFrames: [
              {
                frame: {
                  id: 'aut-frame-id',
                  name: 'Your project: "FakeBlock"',
                },
              },
              {
                frame: {
                  id: 'spec-frame-id',
                  name: 'Your Spec: "spec.js"',
                },
              },
            ],
          },
        }

        this.pageCriClient.send.withArgs('Page.getFrameTree').resolves(frameTree)
      })

      it('sends Fetch.enable only for Document ResourceType', async function () {
        await chrome.open('chrome', 'http://', openOpts, this.automation)

        expect(this.pageCriClient.send).to.have.been.calledWith('Fetch.enable', {
          patterns: [{
            resourceType: 'Document',
          }],
        })
      })

      it('does not add header when not a document', async function () {
        await chrome.open('chrome', 'http://', openOpts, this.automation)

        this.pageCriClient.on.withArgs('Fetch.requestPaused').yield({
          requestId: '1234',
          resourceType: 'Script',
        })

        expect(this.pageCriClient.send).not.to.be.calledWith('Fetch.continueRequest')
      })

      it('does not add header when it is a spec frame request', async function () {
        await chrome.open('chrome', 'http://', openOpts, this.automation)

        this.pageCriClient.on.withArgs('Page.frameAttached').yield()

        await this.pageCriClient.on.withArgs('Fetch.requestPaused').args[0][1]({
          frameId: 'spec-frame-id',
          requestId: '1234',
          resourceType: 'Document',
          request: {
            url: '/__cypress/integration/spec.js',
          },
        })

        expect(this.pageCriClient.send).to.be.calledWith('Fetch.continueRequest', {
          requestId: '1234',
        })
      })

      it('appends X-Cypress-Is-AUT-Frame header to AUT iframe request', async function () {
        await chrome.open('chrome', 'http://', openOpts, this.automation)

        this.pageCriClient.on.withArgs('Page.frameAttached').yield()

        await this.pageCriClient.on.withArgs('Fetch.requestPaused').args[0][1]({
          frameId: 'aut-frame-id',
          requestId: '1234',
          resourceType: 'Document',
          request: {
            url: 'http://localhost:3000/index.html',
            headers: {
              'X-Foo': 'Bar',
            },
          },
        })

        expect(this.pageCriClient.send).to.be.calledWith('Fetch.continueRequest', {
          requestId: '1234',
          headers: [
            {
              name: 'X-Foo',
              value: 'Bar',
            },
            {
              name: 'X-Cypress-Is-AUT-Frame',
              value: 'true',
            },
          ],
        })
      })

      it('gets frame tree on Page.frameAttached', async function () {
        await chrome.open('chrome', 'http://', openOpts, this.automation)

        this.pageCriClient.on.withArgs('Page.frameAttached').yield()

        expect(this.pageCriClient.send).to.be.calledWith('Page.getFrameTree')
      })

      it('gets frame tree on Page.frameDetached', async function () {
        await chrome.open('chrome', 'http://', openOpts, this.automation)

        this.pageCriClient.on.withArgs('Page.frameDetached').yield()

        expect(this.pageCriClient.send).to.be.calledWith('Page.getFrameTree')
      })
    })
  })

  context('#connectToNewSpec', () => {
    it('launches a new tab, connects a cri client to it, starts video, navigates to the spec url, and handles downloads', async function () {
      const protocolManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      const pageCriClient = {
        send: sinon.stub().resolves(),
        on: sinon.stub(),
        targetId: '1234',
      }

      const mockCurrentlyAttachedProtocolTarget = {}

      const cdpSocketServer = {
        attachCDPClient: sinon.stub(),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
        currentlyAttachedProtocolTarget: mockCurrentlyAttachedProtocolTarget,
        host: 'http://localhost',
        port: 1234,
      }

      const automation = {
        use: sinon.stub().returns(),
      }

      let onInitializeNewBrowserTabCalled = false
      const options = {
        ...openOpts,
        url: 'https://www.google.com',
        downloadsFolder: '/tmp/folder',
        browser: {},
        videoApi: {},
        onInitializeNewBrowserTab: () => {
          onInitializeNewBrowserTabCalled = true
        },
        protocolManager,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)
      sinon.stub(chrome, '_recordVideo').withArgs(sinon.match.object, options.writeVideoFrame, 354).resolves()
      sinon.stub(chrome, '_navigateUsingCRI').withArgs(pageCriClient, options.url, 354).resolves()
      sinon.stub(chrome, '_handleDownloads').withArgs(pageCriClient, options.downloadFolder, automation).resolves()

      await chrome.connectToNewSpec({ majorVersion: 354 }, options, automation, cdpSocketServer)

      expect(automation.use).to.be.called
      expect(chrome._getBrowserCriClient).to.be.called
      expect(chrome._recordVideo).to.be.called
      expect(chrome._navigateUsingCRI).to.be.called
      expect(chrome._handleDownloads).to.be.called
      expect(onInitializeNewBrowserTabCalled).to.be.true
      expect(cdpSocketServer.attachCDPClient).to.be.calledWith(pageCriClient)
      expect(protocolManager.connectToBrowser).to.be.calledWith(mockCurrentlyAttachedProtocolTarget)
    })
  })

  context('#connectProtocolToBrowser', () => {
    it('connects to the browser cri client', async function () {
      const protocolManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      const mockCurrentlyAttachedProtocolTarget = {}

      const pageCriClient = {
        clone: sinon.stub().returns(mockCurrentlyAttachedProtocolTarget),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
        currentlyAttachedProtocolTarget: mockCurrentlyAttachedProtocolTarget,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)

      await chrome.connectProtocolToBrowser({ protocolManager })

      expect(pageCriClient.clone).not.to.be.called
      expect(protocolManager.connectToBrowser).to.be.calledWith(mockCurrentlyAttachedProtocolTarget)
    })

    it('connects to the browser cri client when the protocol target has not been created', async function () {
      const protocolManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      const mockCurrentlyAttachedProtocolTarget = {}

      const pageCriClient = {
        clone: sinon.stub().resolves(mockCurrentlyAttachedProtocolTarget),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)

      await chrome.connectProtocolToBrowser({ protocolManager })

      expect(pageCriClient.clone).to.be.called
      expect(protocolManager.connectToBrowser).to.be.calledWith(mockCurrentlyAttachedProtocolTarget)
      expect(browserCriClient.currentlyAttachedProtocolTarget).to.eq(mockCurrentlyAttachedProtocolTarget)
    })

    it('throws error if there is no browser cri client', function () {
      const protocolManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(null)

      expect(chrome.connectProtocolToBrowser({ protocolManager })).to.be.rejectedWith('Missing pageCriClient in connectProtocolToBrowser')
      expect(protocolManager.connectToBrowser).not.to.be.called
    })

    it('throws error if there is no page cri client', function () {
      const protocolManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      const browserCriClient = {
        currentlyAttachedTarget: null,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)

      expect(chrome.connectProtocolToBrowser({ protocolManager })).to.be.rejectedWith('Missing pageCriClient in connectProtocolToBrowser')
      expect(protocolManager.connectToBrowser).not.to.be.called
    })
  })

  context('#connectCyPromptToBrowser', () => {
    it('connects to the browser cri client', async function () {
      const cyPromptManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      const mockCurrentlyAttachedCyPromptTarget = {}

      const pageCriClient = {
        clone: sinon.stub().returns(mockCurrentlyAttachedCyPromptTarget),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
        currentlyAttachedCyPromptTarget: mockCurrentlyAttachedCyPromptTarget,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)

      await chrome.connectCyPromptToBrowser({ cyPromptManager })

      expect(pageCriClient.clone).not.to.be.called
      expect(cyPromptManager.connectToBrowser).to.be.calledWith(mockCurrentlyAttachedCyPromptTarget)
    })

    it('connects to the browser cri client when the cy prompt target has not been created', async function () {
      const cyPromptManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      const mockCurrentlyAttachedCyPromptTarget = {}

      const pageCriClient = {
        clone: sinon.stub().resolves(mockCurrentlyAttachedCyPromptTarget),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)

      await chrome.connectCyPromptToBrowser({ cyPromptManager })

      expect(pageCriClient.clone).to.be.called
      expect(cyPromptManager.connectToBrowser).to.be.calledWith(mockCurrentlyAttachedCyPromptTarget)
      expect(browserCriClient.currentlyAttachedCyPromptTarget).to.eq(mockCurrentlyAttachedCyPromptTarget)
    })

    it('throws error if there is no browser cri client', function () {
      const cyPromptManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(null)

      expect(chrome.connectCyPromptToBrowser({ cyPromptManager })).to.be.rejectedWith('Missing pageCriClient in connectCyPromptToBrowser')
      expect(cyPromptManager.connectToBrowser).not.to.be.called
    })

    it('throws error if there is no page cri client', function () {
      const cyPromptManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      const browserCriClient = {
        currentlyAttachedTarget: null,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)

      expect(chrome.connectCyPromptToBrowser({ cyPromptManager })).to.be.rejectedWith('Missing pageCriClient in connectCyPromptToBrowser')
      expect(cyPromptManager.connectToBrowser).not.to.be.called
    })
  })

  context('#connectStudioToBrowser', () => {
    it('connects to the browser cri client', async function () {
      const studioManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      const mockCurrentlyAttachedStudioTarget = {}

      const pageCriClient = {
        clone: sinon.stub().returns(mockCurrentlyAttachedStudioTarget),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
        currentlyAttachedStudioTarget: mockCurrentlyAttachedStudioTarget,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)

      await chrome.connectStudioToBrowser({ studioManager })

      expect(pageCriClient.clone).not.to.be.called
      expect(studioManager.connectToBrowser).to.be.calledWith(mockCurrentlyAttachedStudioTarget)
    })

    it('connects to the browser cri client when the studio target has not been created', async function () {
      const studioManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      const mockCurrentlyAttachedStudioTarget = {}

      const pageCriClient = {
        clone: sinon.stub().resolves(mockCurrentlyAttachedStudioTarget),
      }

      const browserCriClient = {
        currentlyAttachedTarget: pageCriClient,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)

      await chrome.connectStudioToBrowser({ studioManager })

      expect(pageCriClient.clone).to.be.called
      expect(studioManager.connectToBrowser).to.be.calledWith(mockCurrentlyAttachedStudioTarget)
      expect(browserCriClient.currentlyAttachedStudioTarget).to.eq(mockCurrentlyAttachedStudioTarget)
    })

    it('throws error if there is no browser cri client', function () {
      const studioManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(null)

      expect(chrome.connectStudioToBrowser({ studioManager })).to.be.rejectedWith('Missing pageCriClient in connectStudioToBrowser')
      expect(studioManager.connectToBrowser).not.to.be.called
    })

    it('throws error if there is no page cri client', function () {
      const studioManager = {
        connectToBrowser: sinon.stub().resolves(),
      }

      const browserCriClient = {
        currentlyAttachedTarget: null,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)

      expect(chrome.connectStudioToBrowser({ studioManager })).to.be.rejectedWith('Missing pageCriClient in connectStudioToBrowser')
      expect(studioManager.connectToBrowser).not.to.be.called
    })
  })

  context('#closeProtocolConnection', () => {
    it('closes the protocol connection', async function () {
      const mockCurrentlyAttachedProtocolTarget = {
        close: sinon.stub().resolves(),
      }

      const browserCriClient = {
        currentlyAttachedProtocolTarget: mockCurrentlyAttachedProtocolTarget,
      }

      sinon.stub(chrome, '_getBrowserCriClient').returns(browserCriClient)

      await chrome.closeProtocolConnection()

      expect(mockCurrentlyAttachedProtocolTarget.close).to.be.called
      expect(browserCriClient.currentlyAttachedProtocolTarget).to.be.undefined
    })
  })

  context('#_getArgs', () => {
    it('disables gpu when linux', () => {
      sinon.stub(os, 'platform').returns('linux')

      const args = chrome._getArgs({}, {})

      expect(args).to.include('--disable-gpu')
    })

    it('does not disable gpu when not linux', () => {
      sinon.stub(os, 'platform').returns('darwin')

      const args = chrome._getArgs({}, {})

      expect(args).not.to.include('--disable-gpu')
    })

    it('turns off sandbox when linux', () => {
      sinon.stub(os, 'platform').returns('linux')

      const args = chrome._getArgs({}, {})

      expect(args).to.include('--no-sandbox')
    })

    it('does not turn off sandbox when not linux', () => {
      sinon.stub(os, 'platform').returns('win32')

      const args = chrome._getArgs({}, {})

      expect(args).not.to.include('--no-sandbox')
    })

    it('adds user agent when options.userAgent', () => {
      const args = chrome._getArgs({}, {
        userAgent: 'foo',
      })

      expect(args).to.include('--user-agent=foo')
    })

    it('does not add user agent', () => {
      const args = chrome._getArgs({}, {})

      expect(args).not.to.include('--user-agent=foo')
    })

    it('disables RootLayerScrolling in versions 66 or 67', () => {
      const arg = '--disable-blink-features=RootLayerScrolling'

      const disabledRootLayerScrolling = function (version, bool) {
        const args = chrome._getArgs({
          majorVersion: version,
        }, {})

        if (bool) {
          return expect(args).to.include(arg)
        }

        expect(args).not.to.include(arg)
      }

      disabledRootLayerScrolling('65', false)
      disabledRootLayerScrolling('66', true)
      disabledRootLayerScrolling('67', true)

      disabledRootLayerScrolling('68', false)
    })

    // https://github.com/cypress-io/cypress/issues/1872
    it('adds <-loopback> proxy bypass rule in version 72+', () => {
      const arg = '--proxy-bypass-list=<-loopback>'

      const chromeVersionHasLoopback = function (version, bool) {
        const args = chrome._getArgs({
          majorVersion: version,
        }, {})

        if (bool) {
          return expect(args).to.include(arg)
        }

        expect(args).not.to.include(arg)
      }

      chromeVersionHasLoopback('71', false)
      chromeVersionHasLoopback('72', true)

      return chromeVersionHasLoopback('73', true)
    })
  })

  context('#_getChromePreferences', () => {
    it('returns map of empty if the files do not exist', () => {
      sinon.stub(fs, 'readJson')
      .withArgs('/foo/Default/Preferences').rejects({ code: 'ENOENT' })
      .withArgs('/foo/Default/Secure Preferences').rejects({ code: 'ENOENT' })
      .withArgs('/foo/Local State').rejects({ code: 'ENOENT' })

      expect(chrome._getChromePreferences('/foo')).to.eventually.deep.eq({
        default: {},
        defaultSecure: {},
        localState: {},
      })
    })

    it('returns map of json objects if the files do exist', () => {
      sinon.stub(fs, 'readJson')
      .withArgs('/foo/Default/Preferences').resolves({ foo: 'bar' })
      .withArgs('/foo/Default/Secure Preferences').resolves({ bar: 'baz' })
      .withArgs('/foo/Local State').resolves({ baz: 'quux' })

      expect(chrome._getChromePreferences('/foo')).to.eventually.deep.eq({
        default: { foo: 'bar' },
        defaultSecure: { bar: 'baz' },
        localState: { baz: 'quux' },
      })
    })
  })

  context('#_mergeChromePreferences', () => {
    it('merges as expected', () => {
      const originalPrefs = {
        default: {},
        defaultSecure: {
          foo: 'bar',
          deleteThis: 'nephew',
        },
        localState: {},
      }

      const newPrefs = {
        default: {
          something: {
            nested: 'here',
          },
        },
        defaultSecure: {
          deleteThis: null,
        },
        someGarbage: true,
      }

      const expected = {
        default: {
          something: {
            nested: 'here',
          },
        },
        defaultSecure: {
          foo: 'bar',
        },
        localState: {},
      }

      expect(chrome._mergeChromePreferences(originalPrefs, newPrefs)).to.deep.eq(expected)
    })
  })

  context('#_writeChromePreferences', () => {
    it('writes json as expected', () => {
      const outputJson = sinon.stub(fs, 'outputJson')
      const defaultPrefs = outputJson.withArgs('/foo/Default/Preferences').resolves()
      const securePrefs = outputJson.withArgs('/foo/Default/Secure Preferences').resolves()
      const statePrefs = outputJson.withArgs('/foo/Local State').resolves()

      const originalPrefs = {
        default: {},
        defaultSecure: {
          foo: 'bar',
          deleteThis: 'nephew',
        },
        localState: {},
      }

      const newPrefs = chrome._mergeChromePreferences(originalPrefs, {
        default: {
          something: {
            nested: 'here',
          },
        },
        defaultSecure: {
          deleteThis: null,
        },
        someGarbage: true,
      })

      expect(chrome._writeChromePreferences('/foo', originalPrefs, newPrefs)).to.eventually.equal()
      .then(() => {
        expect(defaultPrefs).to.be.calledWith('/foo/Default/Preferences', {
          something: {
            nested: 'here',
          },
        })

        expect(securePrefs).to.be.calledWith('/foo/Default/Secure Preferences', {
          foo: 'bar',
        })

        // no changes were made
        expect(statePrefs).to.not.be.called
      })
    })

    it('writes default preferences when they do not exist on disk', async () => {
      const outputJson = sinon.stub(fs, 'outputJson')
      const defaultPrefs = outputJson.withArgs('/foo/Default/Preferences').resolves()
      const securePrefs = outputJson.withArgs('/foo/Default/Secure Preferences').resolves()
      const statePrefs = outputJson.withArgs('/foo/Local State').resolves()

      // Mock _getDefaultChromePreferences to return fake preferences for testing
      const mockDefaultPrefs = mockGetDefaultChromePreferences()

      // Simulate empty preferences read from disk (no defaults exist yet)
      const originalPrefs = {
        default: {},
        defaultSecure: {},
        localState: {},
      }

      // Get the default preferences that should be written
      const defaultChromePrefs = chrome._getDefaultChromePreferences()

      await chrome._writeChromePreferences('/foo', originalPrefs, defaultChromePrefs)

      // Should write default preferences since they don't exist on disk
      expect(defaultPrefs).to.be.calledWith('/foo/Default/Preferences', {
        fake_preference: {
          value: 'value',
        },
      })

      // defaultSecure is empty, so it should not be written
      expect(securePrefs).to.not.be.called

      expect(statePrefs).to.be.calledWith('/foo/Local State', {
        fake_local_state: {
          value: 'value',
        },
      })

      mockDefaultPrefs.restore()
    })
  })

  context('#_getDefaultChromePreferences', () => {
    it('returns expected default preferences', () => {
      const defaultPrefs = chrome._getDefaultChromePreferences()

      expect(defaultPrefs).to.be.an('object')
      expect(defaultPrefs).to.have.property('default')
      expect(defaultPrefs).to.have.property('defaultSecure')
      expect(defaultPrefs).to.have.property('localState')
    })
  })

  context('#_getChromePreferencesWithDefaults', () => {
    beforeEach(() => {
      sinon.stub(fs, 'readJson')
    })

    afterEach(() => {
      fs.readJson.restore()
    })

    it('merges defaults with existing preferences', () => {
      const mockDefaults = createMockDefaultPreferences()
      const mockDefaultPrefs = sinon.stub(chrome, '_getDefaultChromePreferences').returns(mockDefaults)

      fs.readJson.withArgs('/foo/Default/Preferences').resolves({ existing: 'value' })
      fs.readJson.withArgs('/foo/Default/Secure Preferences').resolves({ secure: 'value' })
      fs.readJson.withArgs('/foo/Local State').resolves({ local: 'value' })

      return chrome._getChromePreferencesWithDefaults('/foo')
      .then((result) => {
        // Should merge defaults with existing preferences, where existing values take precedence
        expect(result).to.deep.eq({
          default: {
            fake_preference: {
              value: 'value',
            },
            existing: 'value', // existing preference should be merged in
          },
          defaultSecure: {
            secure: 'value', // existing preference should be merged in
          },
          localState: {
            fake_local_state: {
              value: 'value',
            },
            local: 'value', // existing preference should be merged in
          },
        })
      })
      .finally(() => {
        mockDefaultPrefs.restore()
      })
    })

    it('returns defaults when no existing preferences', () => {
      const mockDefaults = createMockDefaultPreferences()
      const mockDefaultPrefs = sinon.stub(chrome, '_getDefaultChromePreferences').returns(mockDefaults)

      fs.readJson.withArgs('/foo/Default/Preferences').rejects({ code: 'ENOENT' })
      fs.readJson.withArgs('/foo/Default/Secure Preferences').rejects({ code: 'ENOENT' })
      fs.readJson.withArgs('/foo/Local State').rejects({ code: 'ENOENT' })

      return chrome._getChromePreferencesWithDefaults('/foo')
      .then((result) => {
        expect(result).to.deep.eq(mockDefaults)
      })
      .finally(() => {
        mockDefaultPrefs.restore()
      })
    })
  })

  context('#_getChromePreferences with IGNORE_CHROME_PREFERENCES', () => {
    beforeEach(() => {
      process.env.IGNORE_CHROME_PREFERENCES = 'true'
    })

    afterEach(() => {
      delete process.env.IGNORE_CHROME_PREFERENCES
    })

    it('returns empty preferences when IGNORE_CHROME_PREFERENCES is set', () => {
      return chrome._getChromePreferences('/foo')
      .then((result) => {
        expect(result).to.deep.eq({
          default: {},
          defaultSecure: {},
          localState: {},
        })
      })
    })
  })

  context('#_writeChromePreferences with IGNORE_CHROME_PREFERENCES', () => {
    beforeEach(() => {
      process.env.IGNORE_CHROME_PREFERENCES = 'true'
    })

    afterEach(() => {
      delete process.env.IGNORE_CHROME_PREFERENCES
    })

    it('does not write preferences when IGNORE_CHROME_PREFERENCES is set', () => {
      const outputJson = sinon.stub(fs, 'outputJson')

      const originalPrefs = { default: {}, defaultSecure: {}, localState: {} }
      const newPrefs = { default: { test: 'value' }, defaultSecure: {}, localState: {} }

      return chrome._writeChromePreferences('/foo', originalPrefs, newPrefs)
      .then(() => {
        expect(outputJson).to.not.be.called
      })
    })
  })

  context('#_mergeChromePreferences with user preferences', () => {
    it('merges user preferences with defaults correctly', () => {
      // Mock _getDefaultChromePreferences to return fake preferences for testing
      const mockDefaultPrefs = mockGetDefaultChromePreferences()

      const defaultPrefs = chrome._getDefaultChromePreferences()
      const userPrefs = {
        default: {
          fake_preference: {
            value: 'value',
          },
          newSetting: 'userValue', // User adds new setting
        },
        defaultSecure: {
          fake_secure_preference: {
            value: 'value',
          },
        },
        localState: {
          fake_local_state: {
            value: 'value',
          },
          newLocalSetting: 'userValue', // User adds new setting
        },
      }

      const result = chrome._mergeChromePreferences(defaultPrefs, userPrefs)

      expect(result.default).to.deep.eq({
        fake_preference: {
          value: 'value',
        },
        newSetting: 'userValue', // User addition
      })

      expect(result.localState).to.deep.eq({
        fake_local_state: {
          value: 'value',
        },
        newLocalSetting: 'userValue', // User addition
      })

      mockDefaultPrefs.restore()
    })

    it('handles preference deletion with null values', () => {
      const originalPrefs = {
        default: {
          keepThis: 'value',
          deleteThis: 'value',
        },
        defaultSecure: {
          keepThis: 'value',
          deleteThis: 'value',
        },
        localState: {
          keepThis: 'value',
          deleteThis: 'value',
        },
      }

      const newPrefs = {
        default: {
          deleteThis: null, // Should be deleted
          addThis: 'newValue',
        },
        defaultSecure: {
          deleteThis: null, // Should be deleted
        },
        localState: {
          deleteThis: null, // Should be deleted
          addThis: 'newValue',
        },
      }

      const result = chrome._mergeChromePreferences(originalPrefs, newPrefs)

      expect(result.default).to.deep.eq({
        keepThis: 'value',
        addThis: 'newValue',
      })

      expect(result.defaultSecure).to.deep.eq({
        keepThis: 'value',
      })

      expect(result.localState).to.deep.eq({
        keepThis: 'value',
        addThis: 'newValue',
      })
    })
  })

  context('#_getChromePreferences error handling', () => {
    beforeEach(() => {
      sinon.stub(fs, 'readJson')
    })

    afterEach(() => {
      fs.readJson.restore()
    })

    it('handles corrupted preference files gracefully', () => {
      fs.readJson.withArgs('/foo/Default/Preferences').rejects({ code: 'ENOENT' })
      fs.readJson.withArgs('/foo/Default/Secure Preferences').rejects(new Error('Invalid JSON'))
      fs.readJson.withArgs('/foo/Local State').resolves({ valid: 'data' })

      return chrome._getChromePreferences('/foo')
      .then(() => {
        expect.fail('Should have thrown an error for corrupted file')
      })
      .catch((err) => {
        expect(err.message).to.include('Invalid JSON')
      })
    })

    it('handles missing files gracefully', () => {
      fs.readJson.withArgs('/foo/Default/Preferences').rejects({ code: 'ENOENT' })
      fs.readJson.withArgs('/foo/Default/Secure Preferences').rejects({ code: 'ENOENT' })
      fs.readJson.withArgs('/foo/Local State').rejects({ code: 'ENOENT' })

      return chrome._getChromePreferences('/foo')
      .then((result) => {
        expect(result).to.deep.eq({
          default: {},
          defaultSecure: {},
          localState: {},
        })
      })
    })
  })

  context('#open integration with preferences', () => {
    beforeEach(function () {
      // Mock all the dependencies
      this.pageCriClient = {
        send: sinon.stub().resolves(),
        Page: { screencastFrame: sinon.stub().returns() },
        close: sinon.stub().resolves(),
        on: sinon.stub(),
      }

      this.browserCriClient = {
        attachToTargetUrl: sinon.stub().resolves(this.pageCriClient),
        close: sinon.stub().resolves(),
        getWebSocketDebuggerUrl: sinon.stub().returns('ws://debugger'),
        resetBrowserTargets: sinon.stub().resolves(),
      }

      this.automation = {
        push: sinon.stub(),
        use: sinon.stub().returns(),
        onServiceWorkerClientEvent: sinon.stub(),
      }

      this.launchedBrowser = {
        kill: sinon.stub().returns(),
      }

      sinon.stub(chrome, '_writeExtension').resolves('/path/to/ext')
      sinon.stub(BrowserCriClient, 'create').resolves(this.browserCriClient)
      sinon.stub(utils, 'getProfileDir').returns('/profile/dir')
      sinon.stub(utils, 'ensureCleanCache').resolves('/profile/dir/CypressCache')
      sinon.stub(utils, 'initializeCDP').resolves()
      sinon.stub(utils, 'getDefaultLaunchOptions').returns({ args: [], preferences: null })
      sinon.stub(utils, 'executeBeforeBrowserLaunch').resolves({ args: [], preferences: null })
      sinon.stub(utils, 'executeAfterBrowserLaunch').resolves()
      sinon.stub(protocol, 'getRemoteDebuggingPort').resolves(50505)
      sinon.stub(launch, 'launch').resolves(this.launchedBrowser)

      // Mock _getDefaultChromePreferences to return fake preferences for testing
      this.mockDefaultPrefs = mockGetDefaultChromePreferences()

      this.readJson = sinon.stub(fs, 'readJson')
      this.readJson.withArgs('/profile/dir/Default/Preferences').rejects({ code: 'ENOENT' })
      this.readJson.withArgs('/profile/dir/Default/Secure Preferences').rejects({ code: 'ENOENT' })
      this.readJson.withArgs('/profile/dir/Local State').rejects({ code: 'ENOENT' })

      this.outputJson = sinon.stub(fs, 'outputJson')
      this.outputJson.resolves()
    })

    afterEach(function () {
      launch.launch.restore()
      protocol.getRemoteDebuggingPort.restore()
      fs.readJson.restore()
      fs.outputJson.restore()
      this.mockDefaultPrefs.restore()
    })

    it('writes default preferences during browser launch', async function () {
      await chrome.open({ isHeadless: true }, 'http://localhost:3000', openOpts, this.automation)

      // Verify that default preferences were written
      expect(this.outputJson).to.have.been.calledWith(
        '/profile/dir/Default/Preferences',
        sinon.match({
          fake_preference: {
            value: 'value',
          },
        }),
      )

      expect(this.outputJson).to.have.been.calledWith(
        '/profile/dir/Local State',
        sinon.match({
          fake_local_state: {
            value: 'value',
          },
        }),
      )
    })

    it('merges user preferences with defaults during launch', async function () {
      const userPreferences = {
        default: {
          fake_preference: {
            value: 'value',
          },
          customSetting: 'userValue',
        },
        localState: {
          fake_local_state: {
            value: 'value',
          },
        },
      }

      utils.executeBeforeBrowserLaunch.resolves({
        args: [],
        preferences: userPreferences,
      })

      await chrome.open({ isHeadless: true }, 'http://localhost:3000', openOpts, this.automation)

      // Verify that merged preferences were written
      expect(this.outputJson).to.have.been.calledWith(
        '/profile/dir/Default/Preferences',
        sinon.match({
          fake_preference: {
            value: 'value',
          },
          customSetting: 'userValue', // User addition
        }),
      )

      expect(this.outputJson).to.have.been.calledWith(
        '/profile/dir/Local State',
        sinon.match({
          fake_local_state: {
            value: 'value',
          },
        }),
      )
    })
  })
})
