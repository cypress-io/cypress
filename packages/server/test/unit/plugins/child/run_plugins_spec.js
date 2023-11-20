require('../../../spec_helper')

const _ = require('lodash')

const preprocessor = require('../../../../lib/plugins/child/preprocessor')
const util = require('../../../../lib/plugins/util')
const resolve = require('../../../../lib/util/resolve')
const browserUtils = require('../../../../lib/browsers/utils')
const { RunPlugins } = require('../../../../lib/plugins/child/run_plugins')
const crossOrigin = require('../../../../lib/plugins/child/cross_origin')

describe('lib/plugins/child/run_plugins', () => {
  let ipc
  let runPlugins

  beforeEach(() => {
    ipc = {
      send: sinon.spy(),
      on: sinon.stub(),
      removeListener: sinon.spy(),
    }

    runPlugins = new RunPlugins(ipc, 'proj-root', 'cypress.config.js')
  })

  afterEach(() => {
    mockery.deregisterMock('@cypress/webpack-batteries-included-preprocessor')
  })

  context('#runSetupNodeEvents', () => {
    let config
    let setupNodeEventsFn

    beforeEach(() => {
      config = { projectRoot: '/project/root' }

      setupNodeEventsFn = sinon.stub().callsFake((on) => {
        on('after:screenshot', () => {})
        on('task', {})

        return { includeShadowDom: true }
      })
    })

    describe('#load', () => {
      it('calls setupNodeEventsFn with `registerChildEvent` function and initial config', async () => {
        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        expect(setupNodeEventsFn).to.be.calledWith(sinon.match.func, config)
      })

      it('registers default preprocessor if none registered by user', async () => {
        const webpackPreprocessorFn = sinon.spy()
        const webpackPreprocessor = sinon.stub().returns(webpackPreprocessorFn)

        sinon.stub(resolve, 'typescript').returns('/path/to/typescript.js')
        mockery.registerMock('@cypress/webpack-batteries-included-preprocessor', webpackPreprocessor)

        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        const registrations = ipc.send.withArgs('setupTestingType:reply').args[0][1].registrations

        expect(webpackPreprocessor).to.be.calledWith({
          typescript: '/path/to/typescript.js',
        })

        expect(_.last(registrations)).to.eql({
          event: 'file:preprocessor',
          eventId: 5,
        })

        ipc.on.withArgs('execute:plugins').yield('file:preprocessor', { eventId: 5, invocationId: '00' }, ['arg1', 'arg2'])
        expect(webpackPreprocessorFn, 'webpackPreprocessor').to.be.called
      })

      it('does not register default preprocessor if registered by user', async () => {
        const userPreprocessorFn = sinon.spy()
        const webpackPreprocessor = sinon.spy()

        sinon.stub(resolve, 'typescript').returns('/path/to/typescript.js')

        const setupNodeEventsFn = (on) => {
          on('after:screenshot', () => {})
          on('file:preprocessor', userPreprocessorFn)
          on('task', {})

          return config
        }

        mockery.registerMock('@cypress/webpack-batteries-included-preprocessor', webpackPreprocessor)
        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        const registrations = ipc.send.withArgs('setupTestingType:reply').args[0][1].registrations

        expect(webpackPreprocessor).not.to.be.called

        expect(registrations[4]).to.eql({
          event: 'file:preprocessor',
          eventId: 4,
        })

        ipc.on.withArgs('execute:plugins').yield('file:preprocessor', { eventId: 4, invocationId: '00' }, ['arg1', 'arg2'])
        expect(userPreprocessorFn).to.be.called
      })

      it(`sends 'setupTestingType:reply' event with modified config, registrations, and requires`, async () => {
        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        expect(ipc.send).to.be.calledWith('setupTestingType:reply')

        const { setupConfig, registrations, requires } = ipc.send.withArgs('setupTestingType:reply').args[0][1]

        expect(setupConfig).to.eql({ includeShadowDom: true })

        expect(registrations).to.have.length(6)
        expect(_.map(registrations, 'event')).to.eql([
          '_get:task:body',
          '_get:task:keys',
          '_process:cross:origin:callback',
          'after:screenshot',
          'task',
          'file:preprocessor',
        ])

        expect(requires).to.be.an('array')
      })

      it('sends error if setupNodeEvents function rejects the promise', async () => {
        const err = new Error('foo')
        const setupNodeEventsFn = sinon.stub().rejects(err)

        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        expect(ipc.send).to.be.calledWith('setupTestingType:error')

        const error = ipc.send.withArgs('setupTestingType:error').args[0][1]

        expect(error.originalError.message).to.equal('foo')
      })
    })

    describe(`on 'execute:plugins' message`, () => {
      let onFilePreprocessor
      let afterBrowserLaunch
      let beforeBrowserLaunch
      let taskRequested
      let setupNodeEventsFn

      beforeEach(async () => {
        sinon.stub(preprocessor, 'wrap')

        onFilePreprocessor = sinon.stub().resolves()
        afterBrowserLaunch = sinon.stub().resolves()
        beforeBrowserLaunch = sinon.stub().resolves()
        taskRequested = sinon.stub().resolves('foo')

        setupNodeEventsFn = (on) => {
          on('file:preprocessor', onFilePreprocessor)
          on('after:browser:launch', afterBrowserLaunch)
          on('before:browser:launch', beforeBrowserLaunch)
          on('task', taskRequested)
        }
      })

      context('file:preprocessor', () => {
        const ids = { eventId: 0, invocationId: '00' }
        const args = ['arg1', 'arg2']

        beforeEach(async () => {
          await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

          ipc.on.withArgs('execute:plugins').yield('file:preprocessor', ids, args)
        })

        it('calls preprocessor handler', () => {
          expect(preprocessor.wrap).to.be.called
          expect(preprocessor.wrap.lastCall.args[0]).to.equal(ipc)
          expect(preprocessor.wrap.lastCall.args[1]).to.be.a('function')
          expect(preprocessor.wrap.lastCall.args[2]).to.equal(ids)
          expect(preprocessor.wrap.lastCall.args[3]).to.equal(args)
        })

        it('invokes registered function when invoked by handler', () => {
          preprocessor.wrap.lastCall.args[1](3, ['one', 'two'])

          expect(onFilePreprocessor).to.be.calledWith('one', 'two')
        })
      })

      context('before:browser:launch', () => {
        let args
        const ids = { eventId: 1, invocationId: '00' }

        beforeEach(async () => {
          sinon.stub(util, 'wrapChildPromise')

          await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

          const browser = {}
          const launchOptions = browserUtils.getDefaultLaunchOptions({})

          args = [browser, launchOptions]

          ipc.on.withArgs('execute:plugins').yield('before:browser:launch', ids, args)
        })

        it('wraps child promise', () => {
          expect(util.wrapChildPromise).to.be.calledWith(ipc, sinon.match.func, ids, args)
        })

        it('invokes registered function when invoked by handler', () => {
          // console.log(util.wrapChildPromise.withArgs(ipc, sinon.match.func, ids, args).args)
          util.wrapChildPromise.withArgs(ipc, sinon.match.func, ids, args).args[0][1](5, args)

          expect(beforeBrowserLaunch).to.be.calledWith(...args)
        })
      })

      context('after:browser:launch', () => {
        let args
        const ids = { eventId: 2, invocationId: '00' }

        beforeEach(async () => {
          sinon.stub(util, 'wrapChildPromise')

          await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

          const browser = {}
          const launchOptions = browserUtils.getDefaultLaunchOptions({})

          args = [browser, launchOptions]

          ipc.on.withArgs('execute:plugins').yield('after:browser:launch', ids, args)
        })

        it('wraps child promise', () => {
          expect(util.wrapChildPromise).to.be.called
          expect(util.wrapChildPromise.lastCall.args[0]).to.equal(ipc)
          expect(util.wrapChildPromise.lastCall.args[1]).to.be.a('function')
          expect(util.wrapChildPromise.lastCall.args[2]).to.equal(ids)
          expect(util.wrapChildPromise.lastCall.args[3]).to.equal(args)
        })

        it('invokes registered function when invoked by handler', () => {
          util.wrapChildPromise.lastCall.args[1](4, args)

          expect(afterBrowserLaunch).to.be.calledWith(...args)
        })
      })

      context('_process:cross:origin:callback', () => {
        it('calls processCallback with args', async () => {
          const ids = { eventId: '2' }

          sinon.stub(crossOrigin, 'processCallback')

          await runPlugins.runSetupNodeEvents({}, setupNodeEventsFn)
          await runPlugins.execute('_process:cross:origin:callback', ids, ['arg1', 'arg2'])

          expect(crossOrigin.processCallback).to.be.calledWith('arg1', 'arg2')
        })
      })
    })
  })

  context('#invoke', () => {
    it('calls the handler for the specified eventId with the specified args', () => {
      const handler = sinon.spy()

      runPlugins.registeredEventsById['id-1'] = { handler }
      runPlugins.invoke('id-1', [1, 2, 3])

      expect(handler).to.be.calledWith(1, 2, 3)
    })
  })

  describe('tasks', () => {
    const events = {
      'the:task': sinon.stub().returns('result 1'),
      'another:task': sinon.stub().returns('result 2'),
      'a:third:task' () {
        return 'foo'
      },
    }
    const ids = {}

    beforeEach(async () => {
      sinon.stub(util, 'wrapChildPromise')

      const setupNodeEventsFn = sinon.stub().callsFake((on) => {
        on('task', events)
      })

      await runPlugins.runSetupNodeEvents({}, setupNodeEventsFn)
    })

    context('.taskGetBody', () => {
      it('returns the stringified body of the event handler', () => {
        runPlugins.taskGetBody(ids, ['a:third:task'])
        expect(util.wrapChildPromise).to.be.called
        const result = util.wrapChildPromise.lastCall.args[1]('1')

        expect(result.replace(/\s+/g, '')).to.equal('\'a:third:task\'(){return\'foo\'}')
      })

      it('returns an empty string if event handler cannot be found', () => {
        runPlugins.taskGetBody(ids, ['non:existent'])
        expect(util.wrapChildPromise).to.be.called
        const result = util.wrapChildPromise.lastCall.args[1]('1')

        expect(result).to.equal('')
      })
    })

    context('.taskGetKeys', () => {
      it('returns the registered task keys', () => {
        runPlugins.taskGetKeys(ipc, this.events, ids)
        expect(util.wrapChildPromise).to.be.called
        const result = util.wrapChildPromise.lastCall.args[1]('1')

        expect(result).to.eql(['the:task', 'another:task', 'a:third:task'])
      })
    })

    context('.taskExecute', () => {
      it('passes through ipc and ids', () => {
        runPlugins.taskExecute(ids, ['the:task'])
        expect(util.wrapChildPromise).to.be.called
        expect(util.wrapChildPromise.lastCall.args[0]).to.be.equal(ipc)
        expect(util.wrapChildPromise.lastCall.args[2]).to.be.equal(ids)
      })

      it('invokes the callback for the given task if it exists and returns the result', () => {
        runPlugins.taskExecute(ids, ['the:task', 'the:arg'])

        const result = util.wrapChildPromise.lastCall.args[1]('3', ['the:arg'])

        expect(events['the:task']).to.be.calledWith('the:arg')
        expect(result).to.equal('result 1')
      })

      it('returns __cypress_unhandled__ if the task does not exist', () => {
        runPlugins.taskExecute(ids, ['nope'])

        expect(util.wrapChildPromise.lastCall.args[1]('1')).to.equal('__cypress_unhandled__')
      })
    })
  })
})
