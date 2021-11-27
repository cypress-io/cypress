require('../../spec_helper')

const EE = require('events')
const extension = require('@packages/extension')
const electron = require('electron')
const Promise = require('bluebird')
const chromePolicyCheck = require(`${root}../lib/util/chrome_policy_check`)
const logger = require(`${root}../lib/logger`)
const ProjectBase = require(`${root}../lib/project-base`).ProjectBase
const Updater = require(`${root}../lib/updater`)
const errors = require(`${root}../lib/errors`)
const browsers = require(`${root}../lib/browsers`)
const { openProject } = require('../../../lib/open_project')
const events = require(`${root}../lib/gui/events`)
const files = require(`${root}../lib/gui/files`)
const savedState = require(`${root}../lib/saved_state`)

describe('lib/gui/events', () => {
  beforeEach(function () {
    this.send = sinon.stub()
    this.options = {}
    this.cookies = sinon.stub({
      get () {},
      set () {},
      remove () {},
    })

    this.event = {
      sender: {
        send: this.send,
        session: {
          cookies: this.cookies,
        },
      },
    }

    this.bus = new EE()

    sinon.stub(electron.ipcMain, 'on')
    sinon.stub(electron.ipcMain, 'removeAllListeners')

    this.handleEvent = (type, arg, bus = this.bus) => {
      const id = `${type}-${Math.random()}`

      return Promise
      .try(() => {
        return events.handleEvent(this.options, bus, this.event, id, type, arg)
      }).return({
        sendCalledWith: (data) => {
          expect(this.send).to.be.calledWith('response', { id, data })
        },
        sendErrCalledWith: (err) => {
          expect(this.send).to.be.calledWith('response', { id, __error: errors.clone(err, { html: true }) })
        },
      })
    }
  })

  context('.stop', () => {
    it('calls ipc#removeAllListeners', () => {
      events.stop()

      expect(electron.ipcMain.removeAllListeners).to.be.calledOnce
    })
  })

  context('.start', () => {
    it('ipc attaches callback on request', () => {
      sinon.stub(events, 'handleEvent')

      events.start({ foo: 'bar' }, {})

      expect(electron.ipcMain.on).to.be.calledWith('request')
    })

    it('partials in options in request callback', () => {
      electron.ipcMain.on.yields('arg1', 'arg2')
      const handleEvent = sinon.stub(events, 'handleEvent')

      events.start({ foo: 'bar' }, {})

      expect(handleEvent).to.be.calledWith({ foo: 'bar' }, {}, 'arg1', 'arg2')
    })
  })

  context('no ipc event', () => {
    it('throws', function () {
      return this.handleEvent('no:such:event').catch((err) => {
        expect(err.message).to.include('No ipc event registered for: \'no:such:event\'')
      })
    })
  })

  context('dialog', () => {
    describe('show:new:spec:dialog', () => {
      it('calls files.showDialogAndCreateSpec and returns', function () {
        const response = {
          path: '/path/to/project/cypress/integration/my_new_spec.js',
          specs: {
            integration: [
              {
                name: 'app_spec.js',
                absolute: '/path/to/project/cypress/integration/app_spec.js',
                relative: 'cypress/integration/app_spec.js',
              },
            ],
          },
        }

        sinon.stub(files, 'showDialogAndCreateSpec').resolves(response)

        return this.handleEvent('show:new:spec:dialog').then((assert) => {
          return assert.sendCalledWith(response)
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(files, 'showDialogAndCreateSpec').rejects(err)

        return this.handleEvent('show:new:spec:dialog').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })
  })

  context('window', () => {
    describe('window:open', () => {
      beforeEach(function () {
        this.options.projectRoot = '/path/to/my/project'

        this.win = sinon.stub({
          on () {},
          once () {},
          loadURL () {},
          webContents: {},
        })
      })

      it('calls windowOpenFn with args and resolves with return', function () {
        this.options.windowOpenFn = sinon.stub().rejects().withArgs({ type: 'INDEX ' }).resolves(this.win)

        return this.handleEvent('window:open', { type: 'INDEX' })
        .then((assert) => {
          return assert.sendCalledWith(events.nullifyUnserializableValues(this.win))
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        this.options.windowOpenFn = sinon.stub().withArgs(this.options.projectRoot, { foo: 'bar' }).rejects(err)

        return this.handleEvent('window:open', { foo: 'bar' }).then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('window:close', () => {
      it('calls destroy on Windows#getByWebContents', function () {
        const win = {
          destroy: sinon.stub(),
        }

        this.options.getWindowByWebContentsFn = sinon.stub().withArgs(this.event.sender).returns(win)
        this.handleEvent('window:close')

        expect(win.destroy).to.be.calledOnce
      })
    })
  })

  context('updating', () => {
    describe('updater:check', () => {
      it('returns version when new version', function () {
        sinon.stub(Updater, 'check').yieldsTo('onNewVersion', { version: '1.2.3' })

        return this.handleEvent('updater:check').then((assert) => {
          return assert.sendCalledWith('1.2.3')
        })
      })

      it('returns false when no new version', function () {
        sinon.stub(Updater, 'check').yieldsTo('onNoNewVersion')

        return this.handleEvent('updater:check').then((assert) => {
          return assert.sendCalledWith(false)
        })
      })
    })
  })

  context('log events', () => {
    describe('get:logs', () => {
      it('returns array of logs', function () {
        sinon.stub(logger, 'getLogs').resolves([])

        return this.handleEvent('get:logs').then((assert) => {
          return assert.sendCalledWith([])
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(logger, 'getLogs').rejects(err)

        return this.handleEvent('get:logs').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('clear:logs', () => {
      it('returns null', function () {
        sinon.stub(logger, 'clearLogs').resolves()

        return this.handleEvent('clear:logs').then((assert) => {
          return assert.sendCalledWith(null)
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(logger, 'clearLogs').rejects(err)

        return this.handleEvent('clear:logs').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('on:log', () => {
      it('sets send to onLog', function () {
        const onLog = sinon.stub(logger, 'onLog')

        this.handleEvent('on:log')
        expect(onLog).to.be.called

        expect(onLog.getCall(0).args[0]).to.be.a('function')
      })
    })

    describe('off:log', () => {
      it('calls logger#off and returns null', function () {
        sinon.stub(logger, 'off')

        return this.handleEvent('off:log').then((assert) => {
          expect(logger.off).to.be.calledOnce

          return assert.sendCalledWith(null)
        })
      })
    })
  })

  context('user events', () => {
    describe('has:opened:cypress', function () {
      beforeEach(function () {
        this.state = {
          set: sinon.stub().resolves(),
          get: sinon.stub().resolves({}),
        }

        sinon.stub(savedState, 'create').resolves(this.state)
      })

      it('returns false when there is no existing saved state', function () {
        return this.handleEvent('has:opened:cypress')
        .then((assert) => {
          assert.sendCalledWith(false)
        })
      })

      it('returns true when there is any existing saved state', function () {
        this.state.get.resolves({ shownOnboardingModal: true })

        return this.handleEvent('has:opened:cypress')
        .then((assert) => {
          assert.sendCalledWith(true)
        })
      })

      it('sets firstOpenedCypress when the user first opened Cypress if not already set', function () {
        this.state.get.resolves({ shownOnboardingModal: true })
        sinon.stub(Date, 'now').returns(12345)

        return this.handleEvent('has:opened:cypress')
        .then(() => {
          expect(this.state.set).to.be.calledWith('firstOpenedCypress', 12345)
        })
      })

      it('does not set firstOpenedCypress if already set', function () {
        this.state.get.resolves({ firstOpenedCypress: 12345 })

        return this.handleEvent('has:opened:cypress')
        .then(() => {
          expect(this.state.set).not.to.be.called
        })
      })
    })
  })

  context('project events', () => {
    // NOTE: Skipped because we want to take a look and make sure we have the same functionality in v10
    describe.skip('open:project', () => {
      beforeEach(function () {
        sinon.stub(extension, 'setHostAndPath').resolves()
        sinon.stub(browsers, 'getAllBrowsersWith')
        browsers.getAllBrowsersWith.resolves([])
        browsers.getAllBrowsersWith.withArgs('/usr/bin/baz-browser').resolves([{ foo: 'bar' }])
        this.initializeConfig = sinon.stub(ProjectBase.prototype, 'initializeConfig').resolves()
        this.open = sinon.stub(ProjectBase.prototype, 'open').resolves()
        sinon.stub(ProjectBase.prototype, 'close').resolves()

        return sinon.stub(ProjectBase.prototype, 'getConfig').resolves({ some: 'config' })
      })

      afterEach(() => {
        return openProject.close()
      })

      it('open project + returns config', function () {
        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e')
        .then((assert) => {
          expect(this.send.firstCall.args[0]).to.eq('response') // [1].id).to.match(/setup:dashboard:project-/)
          expect(this.send.firstCall.args[1].id).to.match(/open:project-/)
          expect(this.send.firstCall.args[1].data).to.eql({ some: 'config' })
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        this.open.rejects(err)

        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e')
        .then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })

      it('calls browsers.getAllBrowsersWith with no args when no browser specified', function () {
        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e').then(() => {
          expect(browsers.getAllBrowsersWith).to.be.calledWith()
        })
      })

      it('calls browsers.getAllBrowsersWith with browser when browser specified', function () {
        sinon.stub(openProject, 'create').resolves()
        this.options.browser = '/usr/bin/baz-browser'

        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e').then(() => {
          expect(browsers.getAllBrowsersWith).to.be.calledWith(this.options.browser)

          expect(openProject.create).to.be.calledWithMatch(
            '/_test-output/path/to/project',
            {
              browser: '/usr/bin/baz-browser',
              config: {
                browsers: [
                  {
                    foo: 'bar',
                  },
                ],
              },
            },
          )
        })
      })

      it('attaches warning to Chrome browsers when Chrome policy check fails', function () {
        sinon.stub(openProject, 'create').resolves()
        this.options.browser = '/foo'

        browsers.getAllBrowsersWith.withArgs('/foo').resolves([{ family: 'chromium' }, { family: 'some other' }])

        sinon.stub(chromePolicyCheck, 'run').callsArgWith(0, new Error)

        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e').then(() => {
          expect(browsers.getAllBrowsersWith).to.be.calledWith(this.options.browser)

          expect(openProject.create).to.be.calledWithMatch(
            '/_test-output/path/to/project',
            {
              browser: '/foo',
              config: {
                browsers: [
                  {
                    family: 'chromium',
                    warning: 'Cypress detected policy settings on your computer that may cause issues with using this browser. For more information, see https://on.cypress.io/bad-browser-policy',
                  },
                  {
                    family: 'some other',
                  },
                ],
              },
            },
          )
        })
      })
    })
  })
})
