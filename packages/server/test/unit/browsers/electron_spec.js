require('../../spec_helper')

const _ = require('lodash')
const EE = require('events')
const la = require('lazy-ass')
const check = require('check-more-types')

const menu = require(`../../../lib/gui/menu`)
const plugins = require(`../../../lib/plugins`)
const Windows = require(`../../../lib/gui/windows`)
const electron = require(`../../../lib/browsers/electron`)
const savedState = require(`../../../lib/saved_state`)
const { Automation } = require(`../../../lib/automation`)
const { BrowserCriClient } = require('../../../lib/browsers/browser-cri-client')
const electronApp = require('../../../lib/util/electron-app')

const ELECTRON_PID = 10001

describe('lib/browsers/electron', () => {
  beforeEach(function () {
    this.url = 'https://foo.com'
    this.state = {}
    this.options = {
      isTextTerminal: false,
      some: 'var',
      projectRoot: '/foo/',
      onWarning: sinon.stub().returns(),
      browser: {
        isHeadless: false,
      },
      onError: () => {},
    }

    this.automation = new Automation('foo', 'bar', 'baz')
    this.win = _.extend(new EE(), {
      isDestroyed () {
        return false
      },
      close: sinon.stub(),
      loadURL: sinon.stub(),
      focusOnWebView: sinon.stub(),
      show: sinon.stub(),
      destroy: sinon.stub(),
      webContents: {
        session: {
          cookies: {
            get: sinon.stub(),
            set: sinon.stub(),
            remove: sinon.stub(),
          },
          on: sinon.stub(),
          webRequest: {
            onBeforeSendHeaders () {},
          },
          setUserAgent: sinon.stub(),
          getUserAgent: sinon.stub(),
          clearCache: sinon.stub(),
        },
        getOSProcessId: sinon.stub().returns(ELECTRON_PID),
      },
    })

    sinon.stub(Windows, 'installExtension').returns()
    sinon.stub(Windows, 'removeAllExtensions').returns()
    sinon.stub(electronApp, 'getRemoteDebuggingPort').resolves(1234)

    // mock CRI client during testing
    this.pageCriClient = {
      send: sinon.stub().resolves(),
      on: sinon.stub(),
    }

    this.browserCriClient = {
      attachToTargetUrl: sinon.stub().resolves(this.pageCriClient),
      currentlyAttachedTarget: this.pageCriClient,
      close: sinon.stub().resolves(),
    }

    sinon.stub(BrowserCriClient, 'create').resolves(this.browserCriClient)

    this.stubForOpen = function () {
      sinon.stub(electron, '_render').resolves(this.win)
      sinon.stub(plugins, 'has')
      sinon.stub(plugins, 'execute')

      return savedState.create()
      .then((state) => {
        la(check.fn(state.get), 'state is missing .get to stub', state)

        return sinon.stub(state, 'get').resolves(this.state)
      })
    }
  })

  afterEach(function () {
    electron.clearInstanceState()
  })

  context('.connectToNewSpec', () => {
    it('throws an error', async function () {
      expect(() => {
        electron.connectToNewSpec({ isHeaded: true }, { url: 'http://www.example.com' }, this.automation)
      }).to.throw('Attempting to connect to a new spec is not supported for electron, use open instead')
    })
  })

  context('.open', () => {
    beforeEach(function () {
      return this.stubForOpen()
    })

    it('calls render with url, state, and options', function () {
      return electron.open('electron', this.url, this.options, this.automation)
      .then(() => {
        let options = electron._defaultOptions(this.options.projectRoot, this.state, this.options)

        options = Windows.defaults(options)

        const preferencesKeys = _.keys(electron._render.firstCall.args[2])

        expect(_.keys(options)).to.deep.eq(preferencesKeys)

        const electronOptionsArg = electron._render.firstCall.args[3]

        expect(electronOptionsArg.projectRoot).to.eq(this.options.projectRoot)
        expect(electronOptionsArg.isTextTerminal).to.eq(this.options.isTextTerminal)

        expect(electron._render).to.be.calledWith(
          this.url,
          this.automation,
        )
      })
    })

    it('returns custom object emitter interface', function () {
      return electron.open('electron', this.url, this.options, this.automation)
      .then((obj) => {
        expect(obj.browserWindow).to.eq(this.win)
        expect(obj.kill).to.be.a('function')
        expect(obj.removeAllListeners).to.be.a('function')

        expect(this.win.webContents.getOSProcessId).to.be.calledOnce

        expect(obj.pid).to.eq(ELECTRON_PID)
        expect(obj.allPids).to.deep.eq([ELECTRON_PID])
      })
    })

    it('is noop when before:browser:launch yields null', function () {
      plugins.has.returns(true)
      plugins.execute.resolves(null)

      return electron.open('electron', this.url, this.options, this.automation)
      .then(() => {
        const options = electron._render.firstCall.args[2]

        expect(options).to.include.keys('onFocus', 'onNewWindow', 'onCrashed')
      })
    })

    // https://github.com/cypress-io/cypress/issues/1992
    it('it merges in user preferences without removing essential options', function () {
      plugins.has.returns(true)
      plugins.execute.withArgs('before:browser:launch').resolves({
        preferences: {
          foo: 'bar',
        },
      })

      return electron.open('electron', this.url, this.options, this.automation)
      .then(() => {
        const options = electron._render.firstCall.args[2]

        expect(options).to.include.keys('foo', 'onFocus', 'onNewWindow', 'onCrashed')
      })
    })

    it('installs supplied extensions from before:browser:launch and warns on failure', function () {
      plugins.has.returns(true)
      plugins.execute.resolves({ extensions: ['foo', 'bar'] })

      Windows.installExtension.withArgs(sinon.match.any, 'bar').throws()

      return electron.open('electron', this.url, this.options, this.automation)
      .then(() => {
        expect(Windows.removeAllExtensions).to.be.calledOnce

        expect(Windows.installExtension).to.be.calledTwice
        expect(Windows.installExtension).to.be.calledWith(sinon.match.any, 'foo')
        expect(Windows.installExtension).to.be.calledWith(sinon.match.any, 'bar')

        expect(this.options.onWarning).to.be.calledOnce

        const warning = this.options.onWarning.firstCall.args[0].message

        expect(warning).to.contain('Electron').and.contain('bar')

        this.win.emit('closed')

        // called once before installing extensions, once on exit
        expect(Windows.removeAllExtensions).to.be.calledTwice
      })
    })
  })

  context('._launch', () => {
    beforeEach(() => {
      sinon.stub(menu, 'set')
      sinon.stub(electron, '_clearCache').resolves()
      sinon.stub(electron, '_setProxy').resolves()
      sinon.stub(electron, '_setUserAgent')
      sinon.stub(electron, '_getUserAgent')
    })

    it('sets menu.set whether or not its in headless mode', function () {
      return electron._launch(this.win, this.url, this.automation, { show: true, onError: () => {} })
      .then(() => {
        expect(menu.set).to.be.calledWith({ withInternalDevTools: true })
      }).then(() => {
        menu.set.reset()

        return electron._launch(this.win, this.url, this.automation, { show: false, onError: () => {} })
      }).then(() => {
        expect(menu.set).not.to.be.called
      })
    })

    it('sets user agent if options.userAgent', function () {
      return electron._launch(this.win, this.url, this.automation, this.options)
      .then(() => {
        expect(electron._setUserAgent).not.to.be.called
      }).then(() => {
        return electron._launch(this.win, this.url, this.automation, { userAgent: 'foo', onError: () => {} })
      }).then(() => {
        expect(electron._setUserAgent).to.be.calledWith(this.win.webContents, 'foo')
      })
    })

    it('sets proxy if options.proxyServer', function () {
      return electron._launch(this.win, this.url, this.automation, this.options)
      .then(() => {
        expect(electron._setProxy).not.to.be.called
      }).then(() => {
        return electron._launch(this.win, this.url, this.automation, { proxyServer: 'foo', onError: () => {} })
      }).then(() => {
        expect(electron._setProxy).to.be.calledWith(this.win.webContents, 'foo')
      })
    })

    it('calls win.loadURL with url', function () {
      return electron._launch(this.win, this.url, this.automation, this.options)
      .then(() => {
        expect(this.win.loadURL).to.be.calledWith(this.url)
      })
    })

    it('resolves with win', function () {
      return electron._launch(this.win, this.url, this.automation, this.options)
      .then((win) => {
        expect(win).to.eq(this.win)
      })
    })

    it('pushes create:download when download begins', function () {
      const downloadItem = {
        getETag: () => '1',
        getFilename: () => 'file.csv',
        getMimeType: () => 'text/csv',
        getURL: () => 'http://localhost:1234/file.csv',
        once: sinon.stub(),
      }

      this.win.webContents.session.on.withArgs('will-download').yields({}, downloadItem)
      this.options.downloadsFolder = 'downloads'
      sinon.stub(this.automation, 'push')

      return electron._launch(this.win, this.url, this.automation, this.options)
      .then(() => {
        expect(this.automation.push).to.be.calledWith('create:download', {
          id: '1',
          filePath: 'downloads/file.csv',
          mime: 'text/csv',
          url: 'http://localhost:1234/file.csv',
        })
      })
    })

    it('pushes complete:download when download is done', function () {
      const downloadItem = {
        getETag: () => '1',
        getFilename: () => 'file.csv',
        getMimeType: () => 'text/csv',
        getURL: () => 'http://localhost:1234/file.csv',
        once: sinon.stub().yields(),
      }

      this.win.webContents.session.on.withArgs('will-download').yields({}, downloadItem)
      this.options.downloadsFolder = 'downloads'
      sinon.stub(this.automation, 'push')

      return electron._launch(this.win, this.url, this.automation, this.options)
      .then(() => {
        expect(this.automation.push).to.be.calledWith('complete:download', {
          id: '1',
        })
      })
    })

    it('sets download behavior', function () {
      this.options.downloadsFolder = 'downloads'

      return electron._launch(this.win, this.url, this.automation, this.options)
      .then(() => {
        expect(this.pageCriClient.send).to.be.calledWith('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: 'downloads',
        })
      })
    })

    it('registers onRequest automation middleware and calls show when requesting to be focused', function () {
      sinon.spy(this.automation, 'use')

      return electron._launch(this.win, this.url, this.automation, this.options)
      .then(() => {
        expect(this.automation.use).to.be.called
        expect(this.automation.use.lastCall.args[0].onRequest).to.be.a('function')

        this.automation.use.lastCall.args[0].onRequest('focus:browser:window')

        expect(this.win.show).to.be.called
      })
    })

    it('registers onRequest automation middleware and calls destroy when requesting to close the browser tabs', function () {
      sinon.spy(this.automation, 'use')

      return electron._launch(this.win, this.url, this.automation, this.options)
      .then(() => {
        expect(this.automation.use).to.be.called
        expect(this.automation.use.lastCall.args[0].onRequest).to.be.a('function')

        this.automation.use.lastCall.args[0].onRequest('reset:browser:tabs:for:next:test', { shouldKeepTabOpen: true })

        expect(this.win.destroy).to.be.called
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

      it('sends Fetch.enable', async function () {
        await electron._launch(this.win, this.url, this.automation, this.options)

        expect(this.pageCriClient.send).to.have.been.calledWith('Fetch.enable')
      })

      it('does not add header when not a document', async function () {
        await electron._launch(this.win, this.url, this.automation, this.options)

        this.pageCriClient.on.withArgs('Fetch.requestPaused').yield({
          requestId: '1234',
          resourceType: 'Script',
        })

        expect(this.pageCriClient.send).to.be.calledWith('Fetch.continueRequest', {
          requestId: '1234',
        })
      })

      it('does not add header when it is a spec frame request', async function () {
        await electron._launch(this.win, this.url, this.automation, this.options)

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
        await electron._launch(this.win, this.url, this.automation, this.options)

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

      it('appends X-Cypress-Is-XHR-Or-Fetch header to fetch request', async function () {
        await electron._launch(this.win, this.url, this.automation, this.options)

        this.pageCriClient.on.withArgs('Page.frameAttached').yield()

        await this.pageCriClient.on.withArgs('Fetch.requestPaused').args[0][1]({
          frameId: 'aut-frame-id',
          requestId: '1234',
          resourceType: 'Fetch',
          request: {
            url: 'http://localhost:3000/test-request',
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
              name: 'X-Cypress-Is-XHR-Or-Fetch',
              value: 'fetch',
            },
          ],
        })
      })

      it('appends X-Cypress-Is-XHR-Or-Fetch header to xhr request', async function () {
        await electron._launch(this.win, this.url, this.automation, this.options)

        this.pageCriClient.on.withArgs('Page.frameAttached').yield()

        await this.pageCriClient.on.withArgs('Fetch.requestPaused').args[0][1]({
          frameId: 'aut-frame-id',
          requestId: '1234',
          resourceType: 'XHR',
          request: {
            url: 'http://localhost:3000/test-request',
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
              name: 'X-Cypress-Is-XHR-Or-Fetch',
              value: 'xhr',
            },
          ],
        })
      })

      it('gets frame tree on Page.frameAttached', async function () {
        await electron._launch(this.win, this.url, this.automation, this.options)

        this.pageCriClient.on.withArgs('Page.frameAttached').yield()

        expect(this.pageCriClient.send).to.be.calledWith('Page.getFrameTree')
      })

      it('gets frame tree on Page.frameDetached', async function () {
        await electron._launch(this.win, this.url, this.automation, this.options)

        this.pageCriClient.on.withArgs('Page.frameDetached').yield()

        expect(this.pageCriClient.send).to.be.calledWith('Page.getFrameTree')
      })
    })
  })

  describe('setUserAgent with experimentalModifyObstructiveThirdPartyCode', () => {
    let userAgent

    beforeEach(function () {
      userAgent = ''
      this.win.webContents.session.getUserAgent.callsFake(() => userAgent)
    })

    describe('disabled', function () {
      it('does not attempt to replace the user agent', function () {
        this.options.experimentalModifyObstructiveThirdPartyCode = false

        return electron._launch(this.win, this.url, this.automation, this.options)
        .then(() => {
          expect(this.win.webContents.session.setUserAgent).not.to.be.called
          expect(this.pageCriClient.send).not.to.be.calledWith('Network.setUserAgentOverride', {
            userAgent,
          })
        })
      })
    })

    describe('enabled and attempts to replace obstructive user agent string containing:', function () {
      beforeEach(function () {
        this.options.experimentalModifyObstructiveThirdPartyCode = true
      })

      it('does not attempt to replace the user agent if the user passes in an explicit user agent', function () {
        userAgent = 'barbaz'
        this.options.experimentalModifyObstructiveThirdPartyCode = false
        this.options.userAgent = 'foobar'

        return electron._launch(this.win, this.url, this.automation, this.options)
        .then(() => {
          expect(this.win.webContents.session.setUserAgent).to.be.calledWith('foobar')
          expect(this.win.webContents.session.setUserAgent).not.to.be.calledWith('barbaz')
          expect(this.pageCriClient.send).to.be.calledWith('Network.setUserAgentOverride', {
            userAgent: 'foobar',
          })
        })
      })

      it('versioned cypress', function () {
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/10.0.3 Chrome/100.0.4896.75 Electron/18.0.4 Safari/537.36'

        return electron._launch(this.win, this.url, this.automation, this.options)
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'

          expect(this.win.webContents.session.setUserAgent).to.have.been.calledWith(expectedUA)
          expect(this.pageCriClient.send).to.be.calledWith('Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('development cypress', function () {
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/0.0.0-development Chrome/100.0.4896.75 Electron/18.0.4 Safari/537.36'

        return electron._launch(this.win, this.url, this.automation, this.options)
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'

          expect(this.win.webContents.session.setUserAgent).to.have.been.calledWith(expectedUA)
          expect(this.pageCriClient.send).to.be.calledWith('Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('older Windows user agent', function () {
        userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) electron/1.0.0 Chrome/53.0.2785.113 Electron/1.4.3 Safari/537.36'

        return electron._launch(this.win, this.url, this.automation, this.options)
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.113 Safari/537.36'

          expect(this.win.webContents.session.setUserAgent).to.have.been.calledWith(expectedUA)
          expect(this.pageCriClient.send).to.be.calledWith('Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('newer Windows user agent', function () {
        userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.5.00.4689 Chrome/85.0.4183.121 Electron/10.4.7 Safari/537.36'

        return electron._launch(this.win, this.url, this.automation, this.options)
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Teams/1.5.00.4689 Chrome/85.0.4183.121 Safari/537.36'

          expect(this.win.webContents.session.setUserAgent).to.have.been.calledWith(expectedUA)
          expect(this.pageCriClient.send).to.be.calledWith('Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('Linux user agent', function () {
        userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Typora/0.9.93 Chrome/83.0.4103.119 Electron/9.0.5 Safari/E7FBAF'

        return electron._launch(this.win, this.url, this.automation, this.options)
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Typora/0.9.93 Chrome/83.0.4103.119 Safari/E7FBAF'

          expect(this.win.webContents.session.setUserAgent).to.have.been.calledWith(expectedUA)
          expect(this.pageCriClient.send).to.be.calledWith('Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('older MacOS user agent', function () {
        // this user agent containing Cypress was actually a common UA found on a website for Electron purposes...
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/8.3.0 Chrome/91.0.4472.124 Electron/13.1.7 Safari/537.36'

        return electron._launch(this.win, this.url, this.automation, this.options)
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

          expect(this.win.webContents.session.setUserAgent).to.have.been.calledWith(expectedUA)
          expect(this.pageCriClient.send).to.be.calledWith('Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })

      it('newer MacOS user agent', function () {
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'

        return electron._launch(this.win, this.url, this.automation, this.options)
        .then(() => {
          const expectedUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'

          expect(this.win.webContents.session.setUserAgent).to.have.been.calledWith(expectedUA)
          expect(this.pageCriClient.send).to.be.calledWith('Network.setUserAgentOverride', {
            userAgent: expectedUA,
          })
        })
      })
    })
  })

  context('._render', () => {
    beforeEach(function () {
      this.newWin = {
        maximize: sinon.stub(),
        setSize: sinon.stub(),
        show: sinon.stub(),
        destroy: sinon.stub(),
        webContents: this.win.webContents,
      }

      this.preferences = { ...this.options }

      sinon.stub(menu, 'set')
      sinon.stub(electron, '_setProxy').resolves()
      sinon.stub(electron, '_launch').resolves()

      return sinon.stub(Windows, 'create')
      .returns(this.newWin)
    })

    it('creates window instance and calls launch with window', function () {
      return electron._render(this.url, this.automation, this.preferences, this.options)
      .then(() => {
        expect(Windows.create).to.be.calledWith(this.options.projectRoot, this.options)
        expect(this.newWin.setSize).not.called
        expect(electron._launch).to.be.calledWith(this.newWin, this.url, this.automation, this.preferences)
      })
    })

    it('calls setSize on electron window if headless', function () {
      const preferences = { ...this.preferences, browser: { isHeadless: true }, width: 100, height: 200 }

      return electron._render(this.url, this.automation, preferences, this.options)
      .then(() => {
        expect(this.newWin.maximize).not.called
        expect(this.newWin.setSize).calledWith(100, 200)
      })
    })

    it('maximizes electron window if headed and not interactive', function () {
      this.options.isTextTerminal = true

      return electron._render(this.url, this.automation, this.preferences, this.options)
      .then(() => {
        expect(this.newWin.maximize).to.be.called
      })
    })

    it('does not maximize electron window if interactive', function () {
      this.options.isTextTerminal = false

      return electron._render(this.url, this.automation, this.preferences, this.options)
      .then(() => {
        expect(this.newWin.maximize).not.to.be.called
      })
    })
  })

  context('._defaultOptions', () => {
    beforeEach(() => {
      return sinon.stub(menu, 'set')
    })

    it('uses default width if there isn\'t one saved', function () {
      const opts = electron._defaultOptions('/foo', this.state, this.options)

      expect(opts.width).to.eq(1280)
    })

    it('uses saved width if there is one', function () {
      const opts = electron._defaultOptions('/foo', { browserWidth: 1024 }, this.options)

      expect(opts.width).to.eq(1024)
    })

    it('uses default height if there isn\'t one saved', function () {
      const opts = electron._defaultOptions('/foo', this.state, this.options)

      expect(opts.height).to.eq(720)
    })

    it('uses saved height if there is one', function () {
      const opts = electron._defaultOptions('/foo', { browserHeight: 768 }, this.options)

      expect(opts.height).to.eq(768)
    })

    it('uses saved x if there is one', function () {
      const opts = electron._defaultOptions('/foo', { browserX: 200 }, this.options)

      expect(opts.x).to.eq(200)
    })

    it('uses saved y if there is one', function () {
      const opts = electron._defaultOptions('/foo', { browserY: 300 }, this.options)

      expect(opts.y).to.eq(300)
    })

    it('tracks browser state', function () {
      const opts = electron._defaultOptions('/foo', { browserY: 300 }, this.options)

      const args = _.pick(opts.trackState, 'width', 'height', 'x', 'y', 'devTools')

      expect(args).to.deep.eq({
        width: 'browserWidth',
        height: 'browserHeight',
        x: 'browserX',
        y: 'browserY',
        devTools: 'isBrowserDevToolsOpen',
      })
    })

    it('.onFocus', function () {
      const headlessOpts = electron._defaultOptions('/foo', this.state, { browser: { isHeadless: false } })

      headlessOpts.onFocus()
      expect(menu.set).to.be.calledWith({ withInternalDevTools: true })

      menu.set.reset()

      const headedOpts = electron._defaultOptions('/foo', this.state, { browser: { isHeadless: true } })

      headedOpts.onFocus()

      expect(menu.set).not.to.be.called
    })

    describe('.onNewWindow', () => {
      beforeEach(function () {
        return sinon.stub(electron, '_launchChild').resolves(this.win)
      })

      it('passes along event, url, parent window and options', function () {
        const opts = electron._defaultOptions(this.options.projectRoot, this.state, this.options, this.automation)

        const event = {}
        const parentWindow = {
          on: sinon.stub(),
        }

        opts.onNewWindow.call(parentWindow, event, this.url)

        expect(electron._launchChild).to.be.calledWith(
          event, this.url, parentWindow, this.options.projectRoot, this.state, this.options, this.automation,
        )
      })

      it('adds pid of new BrowserWindow to allPids list', function () {
        const opts = electron._defaultOptions(this.options.projectRoot, this.state, this.options)

        const NEW_WINDOW_PID = ELECTRON_PID * 2

        const child = _.cloneDeep(this.win)

        child.webContents.getOSProcessId = sinon.stub().returns(NEW_WINDOW_PID)

        electron._launchChild.resolves(child)

        return this.stubForOpen()
        .then(() => {
          return electron.open('electron', this.url, opts, this.automation)
        }).then((instance) => {
          return opts.onNewWindow.call(this.win, {}, this.url)
          .then(() => {
            expect(instance.allPids).to.deep.eq([ELECTRON_PID, NEW_WINDOW_PID])
          })
        })
      })
    })
  })

  // TODO: these all need to be updated
  context.skip('._launchChild', () => {
    beforeEach(function () {
      this.childWin = _.extend(new EE(), {
        close: sinon.stub(),
        isDestroyed: sinon.stub().returns(false),
        webContents: new EE(),
      })

      Windows.create.onCall(1).resolves(this.childWin)

      this.event = { preventDefault: sinon.stub() }
      this.win.getPosition = () => {
        return [4, 2]
      }

      this.openNewWindow = (options) => {
        // eslint-disable-next-line no-undef
        return launcher.launch('electron', this.url, options).then(() => {
          return this.win.webContents.emit('new-window', this.event, 'some://other.url')
        })
      }
    })

    it('prevents default', function () {
      return this.openNewWindow().then(() => {
        expect(this.event.preventDefault).to.be.called
      })
    })

    it('creates child window', function () {
      return this.openNewWindow().then(() => {
        const args = Windows.create.lastCall.args[0]

        expect(Windows.create).to.be.calledTwice
        expect(args.url).to.equal('some://other.url')
        expect(args.minWidth).to.equal(100)

        expect(args.minHeight).to.equal(100)
      })
    })

    it('offsets it from parent by 100px', function () {
      return this.openNewWindow().then(() => {
        const args = Windows.create.lastCall.args[0]

        expect(args.x).to.equal(104)

        expect(args.y).to.equal(102)
      })
    })

    it('passes along web security', function () {
      return this.openNewWindow({ chromeWebSecurity: false }).then(() => {
        const args = Windows.create.lastCall.args[0]

        expect(args.chromeWebSecurity).to.be.false
      })
    })

    it('sets unique PROJECT type on each new window', function () {
      return this.openNewWindow().then(() => {
        const firstArgs = Windows.create.lastCall.args[0]

        expect(firstArgs.type).to.match(/^PROJECT-CHILD-\d/)
        this.win.webContents.emit('new-window', this.event, 'yet://another.url')
        const secondArgs = Windows.create.lastCall.args[0]

        expect(secondArgs.type).to.match(/^PROJECT-CHILD-\d/)

        expect(firstArgs.type).not.to.equal(secondArgs.type)
      })
    })

    it('set newGuest on child window', function () {
      return this.openNewWindow()
      .then(() => {
        return Promise.delay(1)
      }).then(() => {
        expect(this.event.newGuest).to.equal(this.childWin)
      })
    })

    it('sets menu with dev tools on creation', function () {
      return this.openNewWindow().then(() => {
        // once for main window, once for child
        expect(menu.set).to.be.calledTwice

        expect(menu.set).to.be.calledWith({ withInternalDevTools: true })
      })
    })

    it('sets menu with dev tools on focus', function () {
      return this.openNewWindow().then(() => {
        Windows.create.lastCall.args[0].onFocus()
        // once for main window, once for child, once for focus
        expect(menu.set).to.be.calledThrice

        expect(menu.set).to.be.calledWith({ withInternalDevTools: true })
      })
    })

    it('it closes the child window when the parent window is closed', function () {
      return this.openNewWindow()
      .then(() => {
        return Promise.delay(1)
      }).then(() => {
        this.win.emit('close')

        expect(this.childWin.close).to.be.called
      })
    })

    it('does not close the child window when it is already destroyed', function () {
      return this.openNewWindow()
      .then(() => {
        return Promise.delay(1)
      }).then(() => {
        this.childWin.isDestroyed.returns(true)
        this.win.emit('close')

        expect(this.childWin.close).not.to.be.called
      })
    })

    it('does the same things for children of the child window', function () {
      this.grandchildWin = _.extend(new EE(), {
        close: sinon.stub(),
        isDestroyed: sinon.stub().returns(false),
        webContents: new EE(),
      })

      Windows.create.onCall(2).resolves(this.grandchildWin)
      this.childWin.getPosition = () => {
        return [104, 102]
      }

      return this.openNewWindow().then(() => {
        this.childWin.webContents.emit('new-window', this.event, 'yet://another.url')
        const args = Windows.create.lastCall.args[0]

        expect(Windows.create).to.be.calledThrice
        expect(args.url).to.equal('yet://another.url')
        expect(args.type).to.match(/^PROJECT-CHILD-\d/)
        expect(args.x).to.equal(204)

        expect(args.y).to.equal(202)
      })
    })
  })

  context('._setProxy', () => {
    it('sets proxy rules for webContents', () => {
      const webContents = {
        session: {
          setProxy: sinon.stub().resolves(),
        },
      }

      return electron._setProxy(webContents, 'proxy rules')
      .then(() => {
        expect(webContents.session.setProxy).to.be.calledWith({
          proxyRules: 'proxy rules',
          proxyBypassRules: '<-loopback>',
        })
      })
    })
  })
})
