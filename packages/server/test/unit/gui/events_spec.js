require('../../spec_helper')

const EE = require('events')
const extension = require('@packages/extension')
const electron = require('electron')
const Promise = require('bluebird')
const chromePolicyCheck = require(`${root}../lib/util/chrome_policy_check`)
const cache = require(`${root}../lib/cache`)
const logger = require(`${root}../lib/logger`)
const ProjectBase = require(`${root}../lib/project-base`).ProjectBase
const ProjectStatic = require(`${root}../lib/project_static`)
const Updater = require(`${root}../lib/updater`)
const user = require(`${root}../lib/user`)
const errors = require(`${root}../lib/errors`)
const browsers = require(`${root}../lib/browsers`)
const { openProject } = require('../../../lib/open_project')
const open = require(`${root}../lib/util/open`)
const events = require(`${root}../lib/gui/events`)
const dialog = require(`${root}../lib/gui/dialog`)
const files = require(`${root}../lib/gui/files`)
const ensureUrl = require(`${root}../lib/util/ensure-url`)
const konfig = require(`${root}../lib/konfig`)
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
    describe('show:directory:dialog', () => {
      it('calls dialog.show and returns', function () {
        sinon.stub(dialog, 'show').resolves({ foo: 'bar' })

        return this.handleEvent('show:directory:dialog').then((assert) => {
          return assert.sendCalledWith({ foo: 'bar' })
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(dialog, 'show').rejects(err)

        return this.handleEvent('show:directory:dialog').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

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

  context('user', () => {
    describe('log:out', () => {
      it('calls user.logOut and returns user', function () {
        sinon.stub(user, 'logOut').resolves({ foo: 'bar' })

        return this.handleEvent('log:out').then((assert) => {
          return assert.sendCalledWith({ foo: 'bar' })
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(user, 'logOut').rejects(err)

        return this.handleEvent('log:out').then((assert) => {
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
    describe('open:finder', () => {
      it('opens with open lib', function () {
        sinon.stub(open, 'opn').resolves('okay')

        return this.handleEvent('open:finder', 'path').then((assert) => {
          expect(open.opn).to.be.calledWith('path')

          return assert.sendCalledWith('okay')
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(open, 'opn').rejects(err)

        return this.handleEvent('open:finder', 'path').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })

      it('works even after project is opened (issue #227)', function () {
        sinon.stub(open, 'opn').resolves('okay')
        sinon.stub(ProjectBase.prototype, 'open').resolves()
        sinon.stub(ProjectBase.prototype, 'getConfig').resolves({ some: 'config' })

        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e')
        .then(() => {
          return this.handleEvent('open:finder', 'path')
        }).then((assert) => {
          expect(open.opn).to.be.calledWith('path')

          return assert.sendCalledWith('okay')
        })
      })
    })

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
    describe('remove:project', () => {
      it('remove project + returns arg', function () {
        sinon.stub(cache, 'removeProject').withArgs('/_test-output/path/to/project-e2e').resolves()

        return this.handleEvent('remove:project', '/_test-output/path/to/project-e2e').then((assert) => {
          return assert.sendCalledWith('/_test-output/path/to/project-e2e')
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(cache, 'removeProject').withArgs('/_test-output/path/to/project-e2e').rejects(err)

        return this.handleEvent('remove:project', '/_test-output/path/to/project-e2e').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('open:project', () => {
      function busStub () {
        return {
          on: sinon.stub(),
          removeAllListeners: sinon.stub(),
        }
      }

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

      it('sends \'focus:tests\' onFocusTests', function () {
        const bus = busStub()

        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e', bus)
        .then(() => {
          return this.handleEvent('on:focus:tests', '', bus)
        }).then(() => {
          expect(bus.on).to.have.been.calledWith('focus:tests')
        })
      })

      it('sends \'config:changed\' onSettingsChanged', function () {
        const bus = busStub()

        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e', bus)
        .then(() => {
          return this.handleEvent('on:config:changed', '', bus)
        }).then(() => {
          expect(bus.on).to.have.been.calledWith('config:changed')
        })
      })

      it('sends \'spec:changed\' onSpecChanged', function () {
        const bus = busStub()

        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e')
        .then(() => {
          return this.handleEvent('on:spec:changed', '', bus)
        }).then((assert) => {
          expect(bus.on).to.have.been.calledWith('spec:changed')
        })
      })

      it('sends \'project:warning\' onWarning', function () {
        const bus = busStub()

        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e')
        .then(() => {
          return this.handleEvent('on:project:warning', '', bus)
        }).then(() => {
          expect(bus.on).to.have.been.calledWith('project:warning')
        })
      })

      it('sends \'project:error\' onError', function () {
        const bus = busStub()

        return this.handleEvent('open:project', '/_test-output/path/to/project-e2e')
        .then(() => {
          return this.handleEvent('on:project:error', '', bus)
        }).then((assert) => {
          expect(bus.on).to.have.been.calledWith('project:error')
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

    describe('set:project:id', () => {
      it('calls writeProjectId with projectRoot', function () {
        const arg = { id: '1', projectRoot: '/project/root/', configFile: 'cypress.config.js' }
        const stubWriteProjectId = sinon.stub(ProjectStatic, 'writeProjectId').resolves()

        return this.handleEvent('set:project:id', arg)
        .then(() => {
          expect(stubWriteProjectId).to.be.calledWith(arg)
          expect(this.send.firstCall.args[0]).to.eq('response')
          expect(this.send.firstCall.args[1].id).to.match(/set:project:id-/)
        })
      })
    })

    describe('setup:dashboard:project', () => {
      it('returns result of ProjectStatic.createCiProject', function () {
        const arg = { projectRoot: '/project/root/', configFile: 'cypress.config.js' }
        const stubCreateCiProject = sinon.stub(ProjectStatic, 'createCiProject').resolves()

        return this.handleEvent('setup:dashboard:project', arg)
        .then(() => {
          expect(stubCreateCiProject).to.be.calledWith(arg)
          expect(this.send.firstCall.args[0]).to.eq('response')
          expect(this.send.firstCall.args[1].id).to.match(/setup:dashboard:project-/)
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(ProjectStatic, 'createCiProject').rejects(err)

        return this.handleEvent('setup:dashboard:project', { projectRoot: '/foo/bar' })
        .then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('request:access', () => {
      it('returns result of project.requestAccess', function () {
        sinon.stub(openProject, 'requestAccess').resolves('response')

        return this.handleEvent('request:access', 'org-id-123').then((assert) => {
          expect(openProject.requestAccess).to.be.calledWith('org-id-123')

          return assert.sendCalledWith('response')
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(openProject, 'requestAccess').rejects(err)

        return this.handleEvent('request:access', 'org-id-123').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })

      it('sends ALREADY_MEMBER when statusCode is 403', function () {
        const err = new Error('foo')

        err.statusCode = 403
        sinon.stub(openProject, 'requestAccess').rejects(err)

        return this.handleEvent('request:access', 'org-id-123').then((assert) => {
          expect(this.send).to.be.calledWith('response')

          expect(this.send.firstCall.args[1].__error.type).to.equal('ALREADY_MEMBER')
        })
      })

      it('sends ALREADY_REQUESTED when statusCode is 429 with certain error', function () {
        const err = new Error('foo')

        err.statusCode = 422
        err.errors = {
          userId: ['This User has an existing MembershipRequest to this Organization.'],
        }

        sinon.stub(openProject, 'requestAccess').rejects(err)

        return this.handleEvent('request:access', 'org-id-123').then((assert) => {
          expect(this.send).to.be.calledWith('response')

          expect(this.send.firstCall.args[1].__error.type).to.equal('ALREADY_REQUESTED')
        })
      })

      it('sends type when if existing for other errors', function () {
        const err = new Error('foo')

        err.type = 'SOME_TYPE'
        sinon.stub(openProject, 'requestAccess').rejects(err)

        return this.handleEvent('request:access', 'org-id-123').then((assert) => {
          expect(this.send).to.be.calledWith('response')

          expect(this.send.firstCall.args[1].__error.type).to.equal('SOME_TYPE')
        })
      })

      it('sends UNKNOWN for other errors', function () {
        const err = new Error('foo')

        sinon.stub(openProject, 'requestAccess').rejects(err)

        return this.handleEvent('request:access', 'org-id-123').then((assert) => {
          expect(this.send).to.be.calledWith('response')

          expect(this.send.firstCall.args[1].__error.type).to.equal('UNKNOWN')
        })
      })
    })

    describe('ping:api:server', () => {
      it('returns ensures url', function () {
        sinon.stub(ensureUrl, 'isListening').resolves()

        return this.handleEvent('ping:api:server').then((assert) => {
          expect(ensureUrl.isListening).to.be.calledWith(konfig('api_url'))

          return assert.sendCalledWith()
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(ensureUrl, 'isListening').rejects(err)

        return this.handleEvent('ping:api:server').then((assert) => {
          assert.sendErrCalledWith(err)

          expect(err.apiUrl).to.equal(konfig('api_url'))
        })
      })

      it('sends first of aggregate error', function () {
        const err = new Error('AggregateError')

        err.message = 'aggregate error'
        err[0] = {
          code: 'ECONNREFUSED',
          port: 1234,
          address: '127.0.0.1',
        }

        err.length = 1
        sinon.stub(ensureUrl, 'isListening').rejects(err)

        return this.handleEvent('ping:api:server').then((assert) => {
          assert.sendErrCalledWith(err)
          expect(err.name).to.equal('ECONNREFUSED 127.0.0.1:1234')
          expect(err.message).to.equal('ECONNREFUSED 127.0.0.1:1234')

          expect(err.apiUrl).to.equal(konfig('api_url'))
        })
      })
    })
  })
})
