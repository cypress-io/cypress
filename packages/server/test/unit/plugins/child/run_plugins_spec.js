require('../../../spec_helper')

const _ = require('lodash')
const snapshot = require('snap-shot-it')
const tsnode = require('ts-node')
const Promise = require('bluebird')

const preprocessor = require(`${root}../../lib/plugins/child/preprocessor`)
const task = require(`${root}../../lib/plugins/child/task`)
const runPlugins = require(`${root}../../lib/plugins/child/run_plugins`)
const util = require(`${root}../../lib/plugins/util`)
const resolve = require(`${root}../../lib/util/resolve`)
const browserUtils = require(`${root}../../lib/browsers/utils`)
const Fixtures = require(`${root}../../test/support/helpers/fixtures`)

const colorCodeRe = /\[[0-9;]+m/gm
const pathRe = /\/?([a-z0-9_-]+\/)*[a-z0-9_-]+\/([a-z_]+\.\w+)[:0-9]+/gmi

const deferred = () => {
  let reject
  let resolve
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return { promise, resolve, reject }
}

const withoutColorCodes = (str) => {
  return str.replace(colorCodeRe, '<color-code>')
}
const withoutPath = (str) => {
  return str.replace(pathRe, '<path>$2)')
}

describe('lib/plugins/child/run_plugins', () => {
  beforeEach(function () {
    runPlugins.__reset()

    this.ipc = {
      send: sinon.spy(),
      on: sinon.stub(),
      removeListener: sinon.spy(),
    }
  })

  afterEach(() => {
    mockery.deregisterMock('plugins-file')
    mockery.deregisterSubstitute('plugins-file')
    mockery.deregisterMock('@cypress/webpack-batteries-included-preprocessor')
  })

  it('sends error message if pluginsFile is missing', function () {
    mockery.registerSubstitute('plugins-file', '/does/not/exist.coffee')
    runPlugins(this.ipc, 'plugins-file', 'proj-root')
    expect(this.ipc.send).to.be.calledWith('load:error', 'PLUGINS_FILE_ERROR', 'plugins-file')

    return snapshot(this.ipc.send.lastCall.args[3].split('\n')[0])
  })

  it('sends error message if requiring pluginsFile errors', function () {
    // path for substitute is relative to lib/plugins/child/plugins_child.js
    mockery.registerSubstitute(
      'plugins-file',
      Fixtures.path('server/throws_error.js'),
    )

    runPlugins(this.ipc, 'plugins-file', 'proj-root')
    expect(this.ipc.send).to.be.calledWith('load:error', 'PLUGINS_FILE_ERROR', 'plugins-file')

    return snapshot(this.ipc.send.lastCall.args[3].split('\n')[0])
  })

  it('sends error message if pluginsFile has syntax error', function () {
    // path for substitute is relative to lib/plugins/child/plugins_child.js
    mockery.registerSubstitute(
      'plugins-file',
      Fixtures.path('server/syntax_error.js'),
    )

    runPlugins(this.ipc, 'plugins-file', 'proj-root')
    expect(this.ipc.send).to.be.calledWith('load:error', 'PLUGINS_FILE_ERROR', 'plugins-file')

    return snapshot(withoutColorCodes(withoutPath(this.ipc.send.lastCall.args[3].replace(/( +at[^$]+$)+/g, '[stack trace]'))))
  })

  it('sends error message if pluginsFile does not export a function', function () {
    mockery.registerMock('plugins-file', null)
    runPlugins(this.ipc, 'plugins-file', 'proj-root')
    expect(this.ipc.send).to.be.calledWith('load:error', 'PLUGINS_DIDNT_EXPORT_FUNCTION', 'plugins-file')

    return snapshot(JSON.stringify(this.ipc.send.lastCall.args[3]))
  })

  describe('typescript registration', () => {
    beforeEach(function () {
      this.register = sinon.stub(tsnode, 'register')
      sinon.stub(resolve, 'typescript').returns('/path/to/typescript.js')
    })

    it('registers ts-node if typescript is installed', function () {
      runPlugins(this.ipc, '/path/to/plugins/file.js', 'proj-root')

      expect(this.register).to.be.calledWith({
        transpileOnly: true,
        compiler: '/path/to/typescript.js',
        dir: '/path/to/plugins',
        compilerOptions: {
          module: 'CommonJS',
        },
      })
    })

    it('only registers ts-node once', function () {
      runPlugins(this.ipc, '/path/to/plugins/file.js', 'proj-root')
      runPlugins(this.ipc, '/path/to/plugins/file.js', 'proj-root')

      expect(this.register).to.be.calledOnce
    })

    it('does not register ts-node if typescript is not installed', function () {
      resolve.typescript.returns(null)

      runPlugins(this.ipc, '/path/to/plugins/file.js', 'proj-root')

      expect(this.register).not.to.be.called
    })
  })

  describe('on \'load\' message', () => {
    it('sends loaded event with registrations', function () {
      const pluginsDeferred = deferred()
      const config = { projectRoot: '/project/root' }

      mockery.registerMock('plugins-file', (on) => {
        on('after:screenshot', () => {})
        on('task', {})

        return config
      })

      runPlugins(this.ipc, 'plugins-file', 'proj-root')

      this.ipc.on.withArgs('load').yield(config)

      pluginsDeferred.resolve(config)

      return Promise
      .delay(10)
      .then(() => {
        expect(this.ipc.send).to.be.calledWith('loaded', config)
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

      mockery.registerMock('plugins-file', (on) => {
        on('after:screenshot', () => {})
        on('task', {})

        return config
      })

      mockery.registerMock('@cypress/webpack-batteries-included-preprocessor', webpackPreprocessor)
      runPlugins(this.ipc, 'plugins-file', 'proj-root')

      this.ipc.on.withArgs('load').yield(config)

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

        this.ipc.on.withArgs('execute').yield('file:preprocessor', { eventId: 4, invocationId: '00' }, ['arg1', 'arg2'])
        expect(webpackPreprocessorFn, 'webpackPreprocessor').to.be.called
      })
    })

    it('does not register default preprocessor if registered by user', function () {
      const pluginsDeferred = deferred()
      const config = { projectRoot: '/project/root' }
      const userPreprocessorFn = sinon.spy()
      const webpackPreprocessor = sinon.spy()

      sinon.stub(resolve, 'typescript').returns('/path/to/typescript.js')

      mockery.registerMock('plugins-file', (on) => {
        on('after:screenshot', () => {})
        on('file:preprocessor', userPreprocessorFn)
        on('task', {})

        return config
      })

      mockery.registerMock('@cypress/webpack-batteries-included-preprocessor', webpackPreprocessor)
      runPlugins(this.ipc, 'plugins-file', 'proj-root')

      this.ipc.on.withArgs('load').yield(config)

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

        this.ipc.on.withArgs('execute').yield('file:preprocessor', { eventId: 3, invocationId: '00' }, ['arg1', 'arg2'])
        expect(userPreprocessorFn).to.be.called
      })
    })

    it('sends error if pluginsFile function rejects the promise', function (done) {
      const err = new Error('foo')
      const pluginsFn = sinon.stub().rejects(err)

      mockery.registerMock('plugins-file', pluginsFn)
      this.ipc.on.withArgs('load').yields({})
      runPlugins(this.ipc, 'plugins-file', 'proj-root')

      this.ipc.send = _.once((event, errorType, pluginsFile, stack) => {
        expect(event).to.eq('load:error')
        expect(errorType).to.eq('PLUGINS_FUNCTION_ERROR')
        expect(pluginsFile).to.eq('plugins-file')
        expect(stack).to.eq(err.stack)

        return done()
      })
    })

    it('calls function exported by pluginsFile with register function and config', function () {
      const pluginsFn = sinon.spy()

      mockery.registerMock('plugins-file', pluginsFn)
      runPlugins(this.ipc, 'plugins-file', 'proj-root')
      const config = {}

      this.ipc.on.withArgs('load').yield(config)
      expect(pluginsFn).to.be.called
      expect(pluginsFn.lastCall.args[0]).to.be.a('function')

      expect(pluginsFn.lastCall.args[1]).to.equal(config)
    })

    it('sends error if pluginsFile function throws an error', function (done) {
      const err = new Error('foo')

      mockery.registerMock('plugins-file', () => {
        throw err
      })

      runPlugins(this.ipc, 'plugins-file', 'proj-root')
      this.ipc.on.withArgs('load').yield({})

      this.ipc.send = _.once((event, errorType, pluginsFile, stack) => {
        expect(event).to.eq('load:error')
        expect(errorType).to.eq('PLUGINS_FUNCTION_ERROR')
        expect(pluginsFile).to.eq('plugins-file')
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

      const pluginsFn = (register) => {
        register('file:preprocessor', this.onFilePreprocessor)
        register('before:browser:launch', this.beforeBrowserLaunch)

        return register('task', this.taskRequested)
      }

      mockery.registerMock('plugins-file', pluginsFn)

      runPlugins(this.ipc, 'plugins-file', 'proj-root')

      return this.ipc.on.withArgs('load').yield({})
    })

    context('file:preprocessor', () => {
      beforeEach(function () {
        this.ids = { eventId: 0, invocationId: '00' }
      })

      it('calls preprocessor handler', function () {
        const args = ['arg1', 'arg2']

        this.ipc.on.withArgs('execute').yield('file:preprocessor', this.ids, args)
        expect(preprocessor.wrap).to.be.called
        expect(preprocessor.wrap.lastCall.args[0]).to.equal(this.ipc)
        expect(preprocessor.wrap.lastCall.args[1]).to.be.a('function')
        expect(preprocessor.wrap.lastCall.args[2]).to.equal(this.ids)

        expect(preprocessor.wrap.lastCall.args[3]).to.equal(args)
      })

      it('invokes registered function when invoked by handler', function () {
        this.ipc.on.withArgs('execute').yield('file:preprocessor', this.ids, [])
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
        this.ipc.on.withArgs('execute').yield('before:browser:launch', this.ids, this.args)
        expect(util.wrapChildPromise).to.be.called
        expect(util.wrapChildPromise.lastCall.args[0]).to.equal(this.ipc)
        expect(util.wrapChildPromise.lastCall.args[1]).to.be.a('function')
        expect(util.wrapChildPromise.lastCall.args[2]).to.equal(this.ids)

        expect(util.wrapChildPromise.lastCall.args[3]).to.equal(this.args)
      })

      it('invokes registered function when invoked by handler', function () {
        this.ipc.on.withArgs('execute').yield('before:browser:launch', this.ids, this.args)
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

        this.ipc.on.withArgs('execute').yield('task', this.ids, args)
        expect(task.wrap).to.be.called
        expect(task.wrap.lastCall.args[0]).to.equal(this.ipc)
        expect(task.wrap.lastCall.args[1]).to.be.an('object')
        expect(task.wrap.lastCall.args[2]).to.equal(this.ids)

        expect(task.wrap.lastCall.args[3]).to.equal(args)
      })
    })
  })

  describe('errors', () => {
    beforeEach(function () {
      mockery.registerMock('plugins-file', () => {})
      sinon.stub(process, 'on')

      this.err = {
        name: 'error name',
        message: 'error message',
      }

      return runPlugins(this.ipc, 'plugins-file', 'proj-root')
    })

    it('sends the serialized error via ipc on process uncaughtException', function () {
      process.on.withArgs('uncaughtException').yield(this.err)

      expect(this.ipc.send).to.be.calledWith('error', this.err)
    })

    it('sends the serialized error via ipc on process unhandledRejection', function () {
      process.on.withArgs('unhandledRejection').yield(this.err)

      expect(this.ipc.send).to.be.calledWith('error', this.err)
    })

    it('sends the serialized reason via ipc on process unhandledRejection', function () {
      process.on.withArgs('unhandledRejection').yield({ reason: this.err })

      expect(this.ipc.send).to.be.calledWith('error', this.err)
    })
  })
})
