require('../../spec_helper')

const EE = require('events')
const extension = require('@packages/extension')
const electron = require('electron')
const Promise = require('bluebird')
const chromePolicyCheck = require(`../../../lib/util/chrome_policy_check`)
const ProjectBase = require(`../../../lib/project-base`).ProjectBase
const errors = require(`../../../lib/errors`)
const browsers = require(`../../../lib/browsers`)
const { openProject } = require('../../../lib/open_project')
const events = require(`../../../lib/gui/events`)

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

  xcontext('.start', () => {
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
