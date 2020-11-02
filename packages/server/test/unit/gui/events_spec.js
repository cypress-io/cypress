require('../../spec_helper')

const EE = require('events')
const extension = require('@packages/extension')
const electron = require('electron')
const Promise = require('bluebird')
const debug = require('debug')('test')
const chromePolicyCheck = require(`${root}../lib/util/chrome_policy_check`)
const cache = require(`${root}../lib/cache`)
const logger = require(`${root}../lib/logger`)
const Project = require(`${root}../lib/project`)
const Updater = require(`${root}../lib/updater`)
const user = require(`${root}../lib/user`)
const errors = require(`${root}../lib/errors`)
const browsers = require(`${root}../lib/browsers`)
const openProject = require(`${root}../lib/open_project`)
const open = require(`${root}../lib/util/open`)
const auth = require(`${root}../lib/gui/auth`)
const logs = require(`${root}../lib/gui/logs`)
const events = require(`../../../lib/gui/events`)
const dialog = require(`${root}../lib/gui/dialog`)
const ensureUrl = require(`${root}../lib/util/ensure-url`)
const konfig = require(`${root}../lib/konfig`)
const api = require(`${root}../lib/api`)

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

    this.handleEvent = (type, arg) => {
      const id = `${type}-${Math.random()}`

      return Promise
      .try(() => {
        return events.handleEvent(this.options, this.bus, this.event, id, type, arg)
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

      events.start({ foo: 'bar' })

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
  })

  context('user', () => {
    describe('begin:auth', () => {
      it('calls auth.start and returns user', function () {
        sinon.stub(auth, 'start').resolves({ foo: 'bar' })

        return this.handleEvent('begin:auth').then((assert) => {
          return assert.sendCalledWith({ foo: 'bar' })
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(auth, 'start').rejects(err)

        return this.handleEvent('begin:auth').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

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

    describe('get:current:user', () => {
      it('calls user.get and returns user', function () {
        sinon.stub(user, 'get').resolves({ foo: 'bar' })

        return this.handleEvent('get:current:user').then((assert) => {
          return assert.sendCalledWith({ foo: 'bar' })
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(user, 'get').rejects(err)

        return this.handleEvent('get:current:user').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })
  })

  context('external shell', () => {
    describe('external:open', () => {
      it('shell.openExternal with arg', function () {
        electron.shell.openExternal = sinon.spy()

        return this.handleEvent('external:open', { foo: 'bar' }).then(() => {
          expect(electron.shell.openExternal).to.be.calledWith({ foo: 'bar' })
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

    describe('get:release:notes', () => {
      it('returns release notes from api', function () {
        const releaseNotes = { title: 'New in 1.2.3!' }

        sinon.stub(api, 'getReleaseNotes').resolves(releaseNotes)

        return this.handleEvent('get:release:notes').then((assert) => {
          return assert.sendCalledWith(releaseNotes)
        })
      })

      it('sends null if there is an error', function () {
        sinon.stub(api, 'getReleaseNotes').rejects(new Error('failed to get release notes'))

        return this.handleEvent('get:release:notes').then((assert) => {
          return assert.sendCalledWith(null)
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

  context('gui errors', () => {
    describe('gui:error', () => {
      it('calls logs.error with arg', function () {
        const err = new Error('foo')

        sinon.stub(logs, 'error').withArgs(err).resolves()

        return this.handleEvent('gui:error', err).then((assert) => {
          return assert.sendCalledWith(null)
        })
      })

      it('calls logger.createException with error', function () {
        const err = new Error('foo')

        sinon.stub(logger, 'createException').withArgs(err).resolves()

        return this.handleEvent('gui:error', err).then((assert) => {
          expect(logger.createException).to.be.calledOnce

          return assert.sendCalledWith(null)
        })
      })

      it('swallows logger.createException errors', function () {
        const err = new Error('foo')

        sinon.stub(logger, 'createException').withArgs(err).rejects(new Error('err'))

        return this.handleEvent('gui:error', err).then((assert) => {
          expect(logger.createException).to.be.calledOnce

          return assert.sendCalledWith(null)
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')
        const err2 = new Error('bar')

        sinon.stub(logs, 'error').withArgs(err).rejects(err2)

        return this.handleEvent('gui:error', err).then((assert) => {
          return assert.sendErrCalledWith(err2)
        })
      })
    })
  })

  context('user events', () => {
    describe('get:orgs', () => {
      it('returns array of orgs', function () {
        sinon.stub(Project, 'getOrgs').resolves([])

        return this.handleEvent('get:orgs').then((assert) => {
          return assert.sendCalledWith([])
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(Project, 'getOrgs').rejects(err)

        return this.handleEvent('get:orgs').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

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
        sinon.stub(Project.prototype, 'open').resolves()
        sinon.stub(Project.prototype, 'getConfig').resolves({ some: 'config' })

        return this.handleEvent('open:project', '/_test-output/path/to/project')
        .then(() => {
          return this.handleEvent('open:finder', 'path')
        }).then((assert) => {
          expect(open.opn).to.be.calledWith('path')

          return assert.sendCalledWith('okay')
        })
      })
    })
  })

  context('project events', () => {
    describe('get:projects', () => {
      it('returns array of projects', function () {
        sinon.stub(Project, 'getPathsAndIds').resolves([])

        return this.handleEvent('get:projects').then((assert) => {
          return assert.sendCalledWith([])
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(Project, 'getPathsAndIds').rejects(err)

        return this.handleEvent('get:projects').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('get:project:statuses', () => {
      it('returns array of projects with statuses', function () {
        sinon.stub(Project, 'getProjectStatuses').resolves([])

        return this.handleEvent('get:project:statuses').then((assert) => {
          return assert.sendCalledWith([])
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(Project, 'getProjectStatuses').rejects(err)

        return this.handleEvent('get:project:statuses').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('get:project:status', () => {
      it('returns project returned by Project.getProjectStatus', function () {
        sinon.stub(Project, 'getProjectStatus').resolves('project')

        return this.handleEvent('get:project:status').then((assert) => {
          return assert.sendCalledWith('project')
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(Project, 'getProjectStatus').rejects(err)

        return this.handleEvent('get:project:status').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('add:project', () => {
      it('adds project + returns result', function () {
        sinon.stub(Project, 'add').withArgs('/_test-output/path/to/project', this.options).resolves('result')

        return this.handleEvent('add:project', '/_test-output/path/to/project').then((assert) => {
          return assert.sendCalledWith('result')
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(Project, 'add').withArgs('/_test-output/path/to/project', this.options).rejects(err)

        return this.handleEvent('add:project', '/_test-output/path/to/project').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('remove:project', () => {
      it('remove project + returns arg', function () {
        sinon.stub(cache, 'removeProject').withArgs('/_test-output/path/to/project').resolves()

        return this.handleEvent('remove:project', '/_test-output/path/to/project').then((assert) => {
          return assert.sendCalledWith('/_test-output/path/to/project')
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(cache, 'removeProject').withArgs('/_test-output/path/to/project').rejects(err)

        return this.handleEvent('remove:project', '/_test-output/path/to/project').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('open:project', () => {
      beforeEach(function () {
        sinon.stub(extension, 'setHostAndPath').resolves()
        sinon.stub(browsers, 'getAllBrowsersWith')
        browsers.getAllBrowsersWith.resolves([])
        browsers.getAllBrowsersWith.withArgs('/usr/bin/baz-browser').resolves([{ foo: 'bar' }])
        this.open = sinon.stub(Project.prototype, 'open').resolves()
        sinon.stub(Project.prototype, 'close').resolves()

        return sinon.stub(Project.prototype, 'getConfig').resolves({ some: 'config' })
      })

      afterEach(() => {
        return openProject.close()
      })

      it('open project + returns config', function () {
        return this.handleEvent('open:project', '/_test-output/path/to/project')
        .then((assert) => {
          return assert.sendCalledWith({ some: 'config' })
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        this.open.rejects(err)

        return this.handleEvent('open:project', '/_test-output/path/to/project')
        .then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })

      it('sends \'focus:tests\' onFocusTests', function () {
        return this.handleEvent('open:project', '/_test-output/path/to/project')
        .then(() => {
          return this.handleEvent('on:focus:tests')
        }).then((assert) => {
          this.open.lastCall.args[0].onFocusTests()

          return assert.sendCalledWith(undefined)
        })
      })

      it('sends \'config:changed\' onSettingsChanged', function () {
        return this.handleEvent('open:project', '/_test-output/path/to/project')
        .then(() => {
          return this.handleEvent('on:config:changed')
        }).then((assert) => {
          this.open.lastCall.args[0].onSettingsChanged()

          return assert.sendCalledWith(undefined)
        })
      })

      it('sends \'spec:changed\' onSpecChanged', function () {
        return this.handleEvent('open:project', '/_test-output/path/to/project')
        .then(() => {
          return this.handleEvent('on:spec:changed')
        }).then((assert) => {
          this.open.lastCall.args[0].onSpecChanged('/path/to/spec.coffee')

          return assert.sendCalledWith('/path/to/spec.coffee')
        })
      })

      it('sends \'project:warning\' onWarning', function () {
        return this.handleEvent('open:project', '/_test-output/path/to/project')
        .then(() => {
          return this.handleEvent('on:project:warning')
        }).then((assert) => {
          this.open.lastCall.args[0].onWarning({ name: 'foo', message: 'foo' })

          return assert.sendCalledWith({ name: 'foo', message: 'foo' })
        })
      })

      it('sends \'project:error\' onError', function () {
        return this.handleEvent('open:project', '/_test-output/path/to/project')
        .then(() => {
          return this.handleEvent('on:project:error')
        }).then((assert) => {
          this.open.lastCall.args[0].onError({ name: 'foo', message: 'foo' })

          return assert.sendCalledWith({ name: 'foo', message: 'foo' })
        })
      })

      it('calls browsers.getAllBrowsersWith with no args when no browser specified', function () {
        return this.handleEvent('open:project', '/_test-output/path/to/project').then(() => {
          expect(browsers.getAllBrowsersWith).to.be.calledWith()
        })
      })

      it('calls browsers.getAllBrowsersWith with browser when browser specified', function () {
        sinon.stub(openProject, 'create').resolves()
        this.options.browser = '/usr/bin/baz-browser'

        return this.handleEvent('open:project', '/_test-output/path/to/project').then(() => {
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

        return this.handleEvent('open:project', '/_test-output/path/to/project').then(() => {
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

    describe('close:project', () => {
      beforeEach(() => {
        return sinon.stub(Project.prototype, 'close').withArgs({ sync: true }).resolves()
      })

      it('is noop and returns null when no project is open', function () {
        expect(openProject.getProject()).to.be.null

        return this.handleEvent('close:project').then((assert) => {
          return assert.sendCalledWith(null)
        })
      })

      it('closes down open project and returns null', function () {
        sinon.stub(Project.prototype, 'getConfig').resolves({})
        sinon.stub(Project.prototype, 'open').resolves()

        return this.handleEvent('open:project', '/_test-output/path/to/project')
        .then(() => {
          // it should store the opened project
          expect(openProject.getProject()).not.to.be.null

          return this.handleEvent('close:project')
        }).then((assert) => {
          // it should store the opened project
          expect(openProject.getProject()).to.be.null

          return assert.sendCalledWith(null)
        })
      })
    })

    describe('get:runs', () => {
      it('calls openProject.getRuns', function () {
        sinon.stub(openProject, 'getRuns').resolves([])

        return this.handleEvent('get:runs').then((assert) => {
          expect(openProject.getRuns).to.be.called
        })
      })

      it('returns array of runs', function () {
        sinon.stub(openProject, 'getRuns').resolves([])

        return this.handleEvent('get:runs').then((assert) => {
          return assert.sendCalledWith([])
        })
      })

      it('sends UNAUTHENTICATED when statusCode is 401', function () {
        const err = new Error('foo')

        err.statusCode = 401
        sinon.stub(openProject, 'getRuns').rejects(err)

        return this.handleEvent('get:runs').then((assert) => {
          expect(this.send).to.be.calledWith('response')

          expect(this.send.firstCall.args[1].__error.type).to.equal('UNAUTHENTICATED')
        })
      })

      it('sends TIMED_OUT when cause.code is ESOCKETTIMEDOUT', function () {
        const err = new Error('foo')

        err.cause = { code: 'ESOCKETTIMEDOUT' }
        sinon.stub(openProject, 'getRuns').rejects(err)

        return this.handleEvent('get:runs').then((assert) => {
          expect(this.send).to.be.calledWith('response')

          expect(this.send.firstCall.args[1].__error.type).to.equal('TIMED_OUT')
        })
      })

      it('sends NO_CONNECTION when code is ENOTFOUND', function () {
        const err = new Error('foo')

        err.code = 'ENOTFOUND'
        sinon.stub(openProject, 'getRuns').rejects(err)

        return this.handleEvent('get:runs').then((assert) => {
          expect(this.send).to.be.calledWith('response')

          expect(this.send.firstCall.args[1].__error.type).to.equal('NO_CONNECTION')
        })
      })

      it('sends type when if existing for other errors', function () {
        const err = new Error('foo')

        err.type = 'NO_PROJECT_ID'
        sinon.stub(openProject, 'getRuns').rejects(err)

        return this.handleEvent('get:runs').then((assert) => {
          expect(this.send).to.be.calledWith('response')

          expect(this.send.firstCall.args[1].__error.type).to.equal('NO_PROJECT_ID')
        })
      })

      it('sends UNKNOWN + name,message,stack for other errors', function () {
        const err = new Error('foo')

        err.name = 'name'
        err.message = 'message'
        err.stack = 'stack'
        sinon.stub(openProject, 'getRuns').rejects(err)

        return this.handleEvent('get:runs').then((assert) => {
          expect(this.send).to.be.calledWith('response')

          expect(this.send.firstCall.args[1].__error.type).to.equal('UNKNOWN')
        })
      })
    })

    describe('setup:dashboard:project', () => {
      it('returns result of openProject.createCiProject', function () {
        sinon.stub(openProject, 'createCiProject').resolves('response')

        return this.handleEvent('setup:dashboard:project').then((assert) => {
          return assert.sendCalledWith('response')
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(openProject, 'createCiProject').rejects(err)

        return this.handleEvent('setup:dashboard:project').then((assert) => {
          return assert.sendErrCalledWith(err)
        })
      })
    })

    describe('get:record:keys', () => {
      it('returns result of project.getRecordKeys', function () {
        sinon.stub(openProject, 'getRecordKeys').resolves(['ci-key-123'])

        return this.handleEvent('get:record:keys').then((assert) => {
          return assert.sendCalledWith(['ci-key-123'])
        })
      })

      it('catches errors', function () {
        const err = new Error('foo')

        sinon.stub(openProject, 'getRecordKeys').rejects(err)

        return this.handleEvent('get:record:keys').then((assert) => {
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

    describe('launch:browser', () => {
      it('launches browser via openProject', function () {
        sinon.stub(openProject, 'launch').callsFake((browser, spec, opts) => {
          debug('spec was %o', spec)
          expect(browser, 'browser').to.eq('foo')
          expect(spec, 'spec').to.deep.equal({
            name: 'bar',
            absolute: '/path/to/bar',
            relative: 'to/bar',
            specType: 'integration',
            specFilter: undefined,
          })

          opts.onBrowserOpen()
          opts.onBrowserClose()

          return Promise.resolve()
        })

        const spec = {
          name: 'bar',
          absolute: '/path/to/bar',
          relative: 'to/bar',
        }
        const arg = {
          browser: 'foo',
          spec,
          specType: 'integration',
        }

        return this.handleEvent('launch:browser', arg).then(() => {
          expect(this.send.getCall(0).args[1].data).to.include({ browserOpened: true })

          expect(this.send.getCall(1).args[1].data).to.include({ browserClosed: true })
        })
      })

      it('passes specFilter', function () {
        sinon.stub(openProject, 'launch').callsFake((browser, spec, opts) => {
          debug('spec was %o', spec)
          expect(browser, 'browser').to.eq('foo')
          expect(spec, 'spec').to.deep.equal({
            name: 'bar',
            absolute: '/path/to/bar',
            relative: 'to/bar',
            specType: 'integration',
            specFilter: 'network',
          })

          opts.onBrowserOpen()
          opts.onBrowserClose()

          return Promise.resolve()
        })

        const spec = {
          name: 'bar',
          absolute: '/path/to/bar',
          relative: 'to/bar',
        }
        const arg = {
          browser: 'foo',
          spec,
          specType: 'integration',
          specFilter: 'network',
        }

        return this.handleEvent('launch:browser', arg).then(() => {
          expect(this.send.getCall(0).args[1].data).to.include({ browserOpened: true })

          expect(this.send.getCall(1).args[1].data).to.include({ browserClosed: true })
        })
      })

      it('wraps error titles if not set', function () {
        const err = new Error('foo')

        sinon.stub(openProject, 'launch').rejects(err)

        return this.handleEvent('launch:browser', {}).then(() => {
          expect(this.send.getCall(0).args[1].__error).to.include({ message: 'foo', title: 'Error launching browser' })
        })
      })
    })
  })
})
