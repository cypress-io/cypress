require('../../spec_helper')

const cp = require('child_process')

const util = require(`${root}../lib/plugins/util`)
const plugins = require(`${root}../lib/plugins`)

const PLUGIN_PID = 77777

describe('lib/plugins/index', () => {
  beforeEach(function () {
    plugins._reset()

    this.pluginsProcess = {
      send: sinon.spy(),
      on: sinon.stub(),
      kill: sinon.spy(),
      pid: PLUGIN_PID,
    }

    sinon.stub(cp, 'fork').returns(this.pluginsProcess)

    this.ipc = {
      send: sinon.spy(),
      on: sinon.stub(),
    }

    sinon.stub(util, 'wrapIpc').returns(this.ipc)
  })

  context('#init', () => {
    it('is noop if no pluginsFile', () => {
      return plugins.init({}) // doesn't reject or time out
    })

    it('forks child process', function () {
      // have to fire 'loaded' message, otherwise plugins.init promise never resolves
      this.ipc.on.withArgs('loaded').yields([])

      return plugins.init({ pluginsFile: 'cypress-plugin' })
      .then(() => {
        expect(cp.fork).to.be.called
        expect(cp.fork.lastCall.args[0]).to.contain('plugins/child/index.js')

        expect(cp.fork.lastCall.args[1]).to.eql(['--file', 'cypress-plugin'])
      })
    })

    it('uses system Node when available', function () {
      this.ipc.on.withArgs('loaded').yields([])
      const systemNode = '/my/path/to/system/node'
      const config = {
        pluginsFile: 'cypress-plugin',
        nodeVersion: 'system',
        resolvedNodeVersion: 'v1.2.3',
        resolvedNodePath: systemNode,
      }

      return plugins.init(config)
      .then(() => {
        const options = {
          stdio: 'inherit',
          execPath: systemNode,
        }

        expect(cp.fork.lastCall.args[2]).to.eql(options)
      })
    })

    it('uses bundled Node when cannot find system Node', function () {
      this.ipc.on.withArgs('loaded').yields([])
      const config = {
        pluginsFile: 'cypress-plugin',
        nodeVersion: 'system',
        resolvedNodeVersion: 'v1.2.3',
      }

      return plugins.init(config)
      .then(() => {
        const options = {
          stdio: 'inherit',
        }

        expect(cp.fork.lastCall.args[2]).to.eql(options)
      })
    })

    it('calls any handlers registered with the wrapped ipc', function () {
      this.ipc.on.withArgs('loaded').yields([])
      const handler = sinon.spy()

      plugins.registerHandler(handler)

      return plugins.init({ pluginsFile: 'cypress-plugin' })
      .then(() => {
        expect(handler).to.be.called
        expect(handler.lastCall.args[0].send).to.be.a('function')

        expect(handler.lastCall.args[0].on).to.be.a('function')
      })
    })

    it('sends config via ipc', function () {
      this.ipc.on.withArgs('loaded').yields([])
      const config = { pluginsFile: 'cypress-plugin' }

      return plugins.init(config).then(() => {
        expect(this.ipc.send).to.be.calledWith('load', config)
      })
    })

    it('resolves once it receives \'loaded\' message', function () {
      this.ipc.on.withArgs('loaded').yields([])

      // should resolve and not time out
      return plugins.init({ pluginsFile: 'cypress-plugin' })
    })

    it('kills child process if it already exists', function () {
      this.ipc.on.withArgs('loaded').yields([])

      return plugins.init({ pluginsFile: 'cypress-plugin' })
      .then(() => {
        return plugins.init({ pluginsFile: 'cypress-plugin' })
      }).then(() => {
        expect(this.pluginsProcess.kill).to.be.calledOnce
      })
    })

    describe('loaded message', () => {
      beforeEach(function () {
        this.config = {}

        this.ipc.on.withArgs('loaded').yields(this.config, [{
          event: 'some:event',
          eventId: 0,
        }])

        return plugins.init({ pluginsFile: 'cypress-plugin' })
      })

      it('sends \'execute\' message when event is executed, wrapped in promise', function () {
        sinon.stub(util, 'wrapParentPromise').resolves('value').yields('00')

        return plugins.execute('some:event', 'foo', 'bar').then((value) => {
          expect(util.wrapParentPromise).to.be.called
          expect(this.ipc.send).to.be.calledWith(
            'execute',
            'some:event',
            { eventId: 0, invocationId: '00' },
            ['foo', 'bar'],
          )

          expect(value).to.equal('value')
        })
      })
    })

    describe('load:error message', () => {
      context('PLUGINS_FILE_ERROR', () => {
        beforeEach(function () {
          this.ipc.on.withArgs('load:error').yields('PLUGINS_FILE_ERROR', 'path/to/pluginsFile.js', 'error message stack')
        })

        it('rejects plugins.init', () => {
          return plugins.init({ pluginsFile: 'cypress-plugin' })
          .catch((err) => {
            expect(err.message).to.contain('The plugins file is missing or invalid')
            expect(err.message).to.contain('path/to/pluginsFile.js')

            expect(err.details).to.contain('error message stack')
          })
        })
      })

      context('PLUGINS_FUNCTION_ERROR', () => {
        beforeEach(function () {
          this.ipc.on.withArgs('load:error').yields('PLUGINS_FUNCTION_ERROR', 'path/to/pluginsFile.js', 'error message stack')
        })

        it('rejects plugins.init', () => {
          return plugins.init({ pluginsFile: 'cypress-plugin' })
          .catch((err) => {
            expect(err.message).to.contain('The function exported by the plugins file threw an error.')
            expect(err.message).to.contain('path/to/pluginsFile.js')

            expect(err.details).to.contain('error message stack')
          })
        })
      })
    })

    describe('error message', () => {
      beforeEach(function () {
        this.err = {
          name: 'error name',
          message: 'error message',
        }

        this.onError = sinon.spy()
        this.ipc.on.withArgs('loaded').yields([])

        return plugins.init({ pluginsFile: 'cypress-plugin' }, { onError: this.onError })
      })

      it('kills the plugins process when plugins process errors', function () {
        this.pluginsProcess.on.withArgs('error').yield(this.err)

        expect(this.pluginsProcess.kill).to.be.called
      })

      it('kills the plugins process when ipc sends error', function () {
        this.ipc.on.withArgs('error').yield(this.err)

        expect(this.pluginsProcess.kill).to.be.called
      })

      it('calls onError when plugins process errors', function () {
        this.pluginsProcess.on.withArgs('error').yield(this.err)
        expect(this.onError).to.be.called
        expect(this.onError.lastCall.args[0].title).to.equal('Error running plugin')
        expect(this.onError.lastCall.args[0].stack).to.include('The following error was thrown by a plugin')

        expect(this.onError.lastCall.args[0].details).to.include(this.err.message)
      })

      it('calls onError when ipc sends error', function () {
        this.ipc.on.withArgs('error').yield(this.err)
        expect(this.onError).to.be.called
        expect(this.onError.lastCall.args[0].title).to.equal('Error running plugin')
        expect(this.onError.lastCall.args[0].stack).to.include('The following error was thrown by a plugin')

        expect(this.onError.lastCall.args[0].details).to.include(this.err.message)
      })
    })
  })

  context('#register', () => {
    it('registers callback for event', () => {
      const foo = sinon.spy()

      plugins.register('foo', foo)
      plugins.execute('foo')

      expect(foo).to.be.called
    })

    it('throws if event is not a string', () => {
      expect(() => {
        plugins.register()
      }).to.throw('must be called with an event as its 1st argument')
    })

    it('throws if callback is not a function', () => {
      expect(() => {
        plugins.register('foo')
      }).to.throw('must be called with a callback function as its 2nd argument')
    })
  })

  context('#has', () => {
    it('returns true when event has been registered', () => {
      plugins.register('foo', () => {})

      expect(plugins.has('foo')).to.be.true
    })

    it('returns false when event has not been registered', () => {
      expect(plugins.has('foo')).to.be.false
    })
  })

  context('#execute', () => {
    it('calls the callback registered for the event', () => {
      const foo = sinon.spy()

      plugins.register('foo', foo)
      plugins.execute('foo', 'arg1', 'arg2')

      expect(foo).to.be.calledWith('arg1', 'arg2')
    })
  })

  context('#getPluginPid', () => {
    beforeEach(() => {
      plugins._setPluginsProcess(null)
    })

    it('returns the pid if there is a plugins process', function () {
      this.ipc.on.withArgs('loaded').yields([])

      return plugins.init({ pluginsFile: 'cypress-plugin' })
      .then(() => {
        expect(plugins.getPluginPid()).to.eq(PLUGIN_PID)
      })
    })

    it('returns undefined if there is no plugins process', () => {
      expect(plugins.getPluginPid()).to.be.undefined
    })
  })
})
