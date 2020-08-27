require('../../spec_helper')

const _ = require('lodash')
const EE = require('events')
const la = require('lazy-ass')
const check = require('check-more-types')

const menu = require(`${root}../lib/gui/menu`)
const plugins = require(`${root}../lib/plugins`)
const Windows = require(`${root}../lib/gui/windows`)
const electron = require(`${root}../lib/browsers/electron`)
const savedState = require(`${root}../lib/saved_state`)
const Automation = require(`${root}../lib/automation`)

const ELECTRON_PID = 10001

describe('lib/browsers/electron', () => {
  beforeEach(function () {
    this.url = 'https://foo.com'
    this.state = {}
    this.options = {
      some: 'var',
      projectRoot: '/foo/',
      onWarning: sinon.stub().returns(),
    }

    this.automation = Automation.create('foo', 'bar', 'baz')
    this.win = _.extend(new EE(), {
      isDestroyed () {
        return false
      },
      close: sinon.stub(),
      loadURL: sinon.stub(),
      focusOnWebView: sinon.stub(),
      webContents: {
        session: {
          cookies: {
            get: sinon.stub(),
            set: sinon.stub(),
            remove: sinon.stub(),
          },
        },
        getOSProcessId: sinon.stub().returns(ELECTRON_PID),
        'debugger': {
          attach: sinon.stub().returns(),
          sendCommand: sinon.stub().resolves(),
          on: sinon.stub().returns(),
        },
      },
    })

    sinon.stub(Windows, 'installExtension').returns()
    sinon.stub(Windows, 'removeAllExtensions').returns()

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

  context('.open', () => {
    beforeEach(function () {
      return this.stubForOpen()
    })

    it('calls render with url, state, and options', function () {
      return electron.open('electron', this.url, this.options, this.automation)
      .then(() => {
        let options = electron._defaultOptions(this.options.projectRoot, this.state, this.options)

        options = Windows.defaults(options)

        const keys = _.keys(electron._render.firstCall.args[3])

        expect(_.keys(options)).to.deep.eq(keys)

        expect(electron._render).to.be.calledWith(
          this.url,
          this.options.projectRoot,
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

        expect(obj.pid).to.deep.eq([ELECTRON_PID])
      })
    })

    it('is noop when before:browser:launch yields null', function () {
      plugins.has.returns(true)
      plugins.execute.resolves(null)

      return electron.open('electron', this.url, this.options, this.automation)
      .then(() => {
        const options = electron._render.firstCall.args[3]

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
        const options = electron._render.firstCall.args[3]

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
      sinon.stub(electron, '_attachDebugger').resolves()
      sinon.stub(electron, '_clearCache').resolves()
      sinon.stub(electron, '_setProxy').resolves()

      return sinon.stub(electron, '_setUserAgent')
    })

    it('sets menu.set whether or not its in headless mode', function () {
      return electron._launch(this.win, this.url, { show: true })
      .then(() => {
        expect(menu.set).to.be.calledWith({ withDevTools: true })
      }).then(() => {
        menu.set.reset()

        return electron._launch(this.win, this.url, { show: false })
      }).then(() => {
        expect(menu.set).not.to.be.called
      })
    })

    it('sets user agent if options.userAgent', function () {
      return electron._launch(this.win, this.url, this.options)
      .then(() => {
        expect(electron._setUserAgent).not.to.be.called
      }).then(() => {
        return electron._launch(this.win, this.url, { userAgent: 'foo' })
      }).then(() => {
        expect(electron._setUserAgent).to.be.calledWith(this.win.webContents, 'foo')
      })
    })

    it('sets proxy if options.proxyServer', function () {
      return electron._launch(this.win, this.url, this.options)
      .then(() => {
        expect(electron._setProxy).not.to.be.called
      }).then(() => {
        return electron._launch(this.win, this.url, { proxyServer: 'foo' })
      }).then(() => {
        expect(electron._setProxy).to.be.calledWith(this.win.webContents, 'foo')
      })
    })

    it('calls win.loadURL with url', function () {
      return electron._launch(this.win, this.url, this.options)
      .then(() => {
        expect(this.win.loadURL).to.be.calledWith(this.url)
      })
    })

    it('resolves with win', function () {
      return electron._launch(this.win, this.url, this.options)
      .then((win) => {
        expect(win).to.eq(this.win)
      })
    })
  })

  context('._render', () => {
    beforeEach(function () {
      this.newWin = {}

      sinon.stub(menu, 'set')
      sinon.stub(electron, '_setProxy').resolves()
      sinon.stub(electron, '_launch').resolves()

      return sinon.stub(Windows, 'create')
      .withArgs(this.options.projectRoot, this.options)
      .returns(this.newWin)
    })

    it('creates window instance and calls launch with window', function () {
      return electron._render(this.url, this.options.projectRoot, this.automation, this.options)
      .then(() => {
        expect(Windows.create).to.be.calledWith(this.options.projectRoot, this.options)

        expect(electron._launch).to.be.calledWith(this.newWin, this.url, this.options)
      })
    })

    it('registers onRequest automation middleware', function () {
      sinon.spy(this.automation, 'use')

      return electron._render(this.url, this.options.projectRoot, this.automation, this.options)
      .then(() => {
        expect(this.automation.use).to.be.called

        expect(this.automation.use.lastCall.args[0].onRequest).to.be.a('function')
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
      let opts = electron._defaultOptions('/foo', this.state, { show: true })

      opts.onFocus()
      expect(menu.set).to.be.calledWith({ withDevTools: true })

      menu.set.reset()

      opts = electron._defaultOptions('/foo', this.state, { show: false })
      opts.onFocus()

      expect(menu.set).not.to.be.called
    })

    describe('.onNewWindow', () => {
      beforeEach(function () {
        return sinon.stub(electron, '_launchChild').resolves(this.win)
      })

      it('passes along event, url, parent window and options', function () {
        const opts = electron._defaultOptions(this.options.projectRoot, this.state, this.options)

        const event = {}
        const parentWindow = {
          on: sinon.stub(),
        }

        opts.onNewWindow.call(parentWindow, event, this.url)

        expect(electron._launchChild).to.be.calledWith(
          event, this.url, parentWindow, this.options.projectRoot, this.state, this.options,
        )
      })

      it('adds pid of new BrowserWindow to pid list', function () {
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
            expect(instance.pid).to.deep.eq([ELECTRON_PID, NEW_WINDOW_PID])
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

        expect(menu.set).to.be.calledWith({ withDevTools: true })
      })
    })

    it('sets menu with dev tools on focus', function () {
      return this.openNewWindow().then(() => {
        Windows.create.lastCall.args[0].onFocus()
        // once for main window, once for child, once for focus
        expect(menu.set).to.be.calledThrice

        expect(menu.set).to.be.calledWith({ withDevTools: true })
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
