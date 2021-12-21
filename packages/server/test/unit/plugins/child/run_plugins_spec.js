require('../../../spec_helper')

const _ = require('lodash')
const Promise = require('bluebird')

const preprocessor = require(`../../../../lib/plugins/child/preprocessor`)
const task = require(`../../../../lib/plugins/child/task`)
const util = require(`../../../../lib/plugins/util`)
const resolve = require(`../../../../lib/util/resolve`)
const browserUtils = require(`../../../../lib/browsers/utils`)

const RunPlugins = require(`../../../../lib/plugins/child/run_plugins`)

const deferred = () => {
  let reject
  let resolve
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return { promise, resolve, reject }
}

describe('lib/plugins/child/run_plugins', () => {
  let runPlugins

  beforeEach(function () {
    this.ipc = {
      send: sinon.spy(),
      on: sinon.stub(),
      removeListener: sinon.spy(),
    }

    runPlugins = new RunPlugins(this.ipc, 'proj-root', 'cypress.config.js')

    runPlugins.__reset()
  })

  afterEach(() => {
    mockery.deregisterMock('@cypress/webpack-batteries-included-preprocessor')
  })

  it('sends error message if setupNodeEvents is not a function', function () {
    const config = { projectRoot: '/project/root' }

    const setupNodeEventsFn = (on, config) => {
      on('dev-server:start', (options) => {})
      on('after:screenshot', () => {})
      on('task', {})

      return config
    }

    const foo = ((on, config) => {
      on('dev-server:start', (options) => {})

      return setupNodeEventsFn(on, config)
    })

    runPlugins.runSetupNodeEvents(foo)

    this.ipc.on.withArgs('load:plugins').yield(config)

    return Promise
    .delay(10)
    .then(() => {
      expect(this.ipc.send).to.be.calledWith('loaded:plugins', config)
      expect(this.ipc.send).to.be.calledWith('load:error:plugins', 'SETUP_NODE_EVENTS_DO_NOT_SUPPORT_DEV_SERVER', 'cypress.config.js')
    })
  })

  describe('on \'load\' message', () => {
    it('sends loaded event with registrations', function () {
      const pluginsDeferred = deferred()
      const config = { projectRoot: '/project/root' }

      const setupNodeEventsFn = (on) => {
        on('after:screenshot', () => {})
        on('task', {})

        return config
      }

      runPlugins.runSetupNodeEvents(setupNodeEventsFn)

      this.ipc.on.withArgs('load:plugins').yield(config)

      pluginsDeferred.resolve(config)

      return Promise
      .delay(10)
      .then(() => {
        expect(this.ipc.send).to.be.calledWith('loaded:plugins', config)
        const registrations = this.ipc.send.lastCall.args[2]

        expect(registrations).to.have.length(5)

        expect(_.map(registrations, 'event')).to.eql([
          '_get:task:body',
          '_get:task:keys',
          'after:screenshot',
          'task',
          'file:preprocessor',
        ])
      })
    })

    it('registers default preprocessor if none registered by user', function () {
      const pluginsDeferred = deferred()
      const config = { projectRoot: '/project/root' }
      const webpackPreprocessorFn = sinon.spy()
      const webpackPreprocessor = sinon.stub().returns(webpackPreprocessorFn)

      sinon.stub(resolve, 'typescript').returns('/path/to/typescript.js')

      const setupNodeEventsFn = (on) => {
        on('after:screenshot', () => {})
        on('task', {})

        return config
      }

      mockery.registerMock('@cypress/webpack-batteries-included-preprocessor', webpackPreprocessor)

      runPlugins.runSetupNodeEvents(setupNodeEventsFn)

      this.ipc.on.withArgs('load:plugins').yield(config)

      pluginsDeferred.resolve(config)

      return Promise
      .delay(10)
      .then(() => {
        const registrations = this.ipc.send.lastCall.args[2]

        expect(webpackPreprocessor).to.be.calledWith({
          typescript: '/path/to/typescript.js',
        })

        expect(registrations[4]).to.eql({
          event: 'file:preprocessor',
          eventId: 4,
        })

        this.ipc.on.withArgs('execute:plugins').yield('file:preprocessor', { eventId: 4, invocationId: '00' }, ['arg1', 'arg2'])
        expect(webpackPreprocessorFn, 'webpackPreprocessor').to.be.called
      })
    })

    it('does not register default preprocessor if registered by user', function () {
      const pluginsDeferred = deferred()
      const config = { projectRoot: '/project/root' }
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
      runPlugins.runSetupNodeEvents(setupNodeEventsFn)

      this.ipc.on.withArgs('load:plugins').yield(config)

      pluginsDeferred.resolve(config)

      return Promise
      .delay(10)
      .then(() => {
        const registrations = this.ipc.send.lastCall.args[2]

        expect(webpackPreprocessor).not.to.be.called

        expect(registrations[3]).to.eql({
          event: 'file:preprocessor',
          eventId: 3,
        })

        this.ipc.on.withArgs('execute:plugins').yield('file:preprocessor', { eventId: 3, invocationId: '00' }, ['arg1', 'arg2'])
        expect(userPreprocessorFn).to.be.called
      })
    })

    it('sends error if pluginsFile function rejects the promise', function (done) {
      const err = new Error('foo')
      const setupNodeEventsFn = sinon.stub().rejects(err)

      this.ipc.on.withArgs('load:plugins').yields({})
      runPlugins.runSetupNodeEvents(setupNodeEventsFn)

      this.ipc.send = _.once((event, errorType, stack) => {
        expect(event).to.eq('load:error:plugins')
        expect(errorType).to.eq('PLUGINS_FUNCTION_ERROR')
        expect(stack).to.eq(err.stack)

        return done()
      })
    })

    it('calls function exported by pluginsFile with register function and config', function () {
      const setupNodeEventsFn = sinon.spy()

      runPlugins.runSetupNodeEvents(setupNodeEventsFn)

      const config = {}

      this.ipc.on.withArgs('load:plugins').yield(config)
      expect(setupNodeEventsFn).to.be.called
      expect(setupNodeEventsFn.lastCall.args[0]).to.be.a('function')

      expect(setupNodeEventsFn.lastCall.args[1]).to.equal(config)
    })

    it('sends error if pluginsFile function throws an error', function (done) {
      const err = new Error('foo')

      const setupNodeEventsFn = () => {
        throw err
      }

      runPlugins.runSetupNodeEvents(setupNodeEventsFn)

      this.ipc.on.withArgs('load:plugins').yield({})

      this.ipc.send = _.once((event, errorType, stack) => {
        expect(event).to.eq('load:error:plugins')
        expect(errorType).to.eq('PLUGINS_FUNCTION_ERROR')
        expect(stack).to.eq(err.stack)

        return done()
      })
    })
  })

  describe('on \'execute\' message', () => {
    beforeEach(function () {
      sinon.stub(preprocessor, 'wrap')

      this.onFilePreprocessor = sinon.stub().resolves()
      this.beforeBrowserLaunch = sinon.stub().resolves()
      this.taskRequested = sinon.stub().resolves('foo')

      const setupNodeEventsFn = (register) => {
        register('file:preprocessor', this.onFilePreprocessor)
        register('before:browser:launch', this.beforeBrowserLaunch)

        return register('task', this.taskRequested)
      }

      runPlugins.runSetupNodeEvents(setupNodeEventsFn)

      return this.ipc.on.withArgs('load:plugins').yield({})
    })

    context('file:preprocessor', () => {
      beforeEach(function () {
        this.ids = { eventId: 0, invocationId: '00' }
      })

      it('calls preprocessor handler', function () {
        const args = ['arg1', 'arg2']

        this.ipc.on.withArgs('execute:plugins').yield('file:preprocessor', this.ids, args)
        expect(preprocessor.wrap).to.be.called
        expect(preprocessor.wrap.lastCall.args[0]).to.equal(this.ipc)
        expect(preprocessor.wrap.lastCall.args[1]).to.be.a('function')
        expect(preprocessor.wrap.lastCall.args[2]).to.equal(this.ids)

        expect(preprocessor.wrap.lastCall.args[3]).to.equal(args)
      })

      it('invokes registered function when invoked by handler', function () {
        this.ipc.on.withArgs('execute:plugins').yield('file:preprocessor', this.ids, [])
        preprocessor.wrap.lastCall.args[1](2, ['one', 'two'])

        expect(this.onFilePreprocessor).to.be.calledWith('one', 'two')
      })
    })

    context('before:browser:launch', () => {
      beforeEach(function () {
        sinon.stub(util, 'wrapChildPromise')

        const browser = {}
        const launchOptions = browserUtils.getDefaultLaunchOptions({})

        this.args = [browser, launchOptions]
        this.ids = { eventId: 1, invocationId: '00' }
      })

      it('wraps child promise', function () {
        this.ipc.on.withArgs('execute:plugins').yield('before:browser:launch', this.ids, this.args)
        expect(util.wrapChildPromise).to.be.called
        expect(util.wrapChildPromise.lastCall.args[0]).to.equal(this.ipc)
        expect(util.wrapChildPromise.lastCall.args[1]).to.be.a('function')
        expect(util.wrapChildPromise.lastCall.args[2]).to.equal(this.ids)

        expect(util.wrapChildPromise.lastCall.args[3]).to.equal(this.args)
      })

      it('invokes registered function when invoked by handler', function () {
        this.ipc.on.withArgs('execute:plugins').yield('before:browser:launch', this.ids, this.args)
        util.wrapChildPromise.lastCall.args[1](3, this.args)

        expect(this.beforeBrowserLaunch).to.be.calledWith(...this.args)
      })
    })

    context('task', () => {
      beforeEach(function () {
        sinon.stub(task, 'wrap')
        this.ids = { eventId: 5, invocationId: '00' }
      })

      it('calls task handler', function () {
        const args = ['arg1']

        this.ipc.on.withArgs('execute:plugins').yield('task', this.ids, args)
        expect(task.wrap).to.be.called
        expect(task.wrap.lastCall.args[0]).to.equal(this.ipc)
        expect(task.wrap.lastCall.args[1]).to.be.an('object')
        expect(task.wrap.lastCall.args[2]).to.equal(this.ids)

        expect(task.wrap.lastCall.args[3]).to.equal(args)
      })
    })
  })
})
