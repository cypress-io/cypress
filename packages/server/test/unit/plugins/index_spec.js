const stripAnsi = require('strip-ansi')

require('../../spec_helper')

const mockedEnv = require('mocked-env')
const { omit } = require('lodash')
const cp = require('child_process')
const { getCtx } = require('../../../lib/makeDataContext')
const FixturesHelper = require('@tooling/system-tests')

const plugins = require('../../../lib/plugins')
const util = require('../../../lib/plugins/util')

const PLUGIN_PID = 77777

let ctx

// TODO: (Alejandro) - checking tests on CI
describe.skip('lib/plugins/index', () => {
  let pluginsProcess
  let ipc
  let configExtras
  let getOptions

  beforeEach(async () => {
    ctx = getCtx()
    plugins._reset()

    FixturesHelper.scaffold()

    const todosPath = FixturesHelper.projectPath('todos')

    configExtras = {
      projectRoot: todosPath,
      configFile: `${todosPath}/cypress.config.js`,
    }

    await ctx.setCurrentProjectAndTestingTypeForTestSetup(todosPath)

    getOptions = (overrides = {}) => {
      return {
        ...configExtras,
        ...overrides,
      }
    }

    pluginsProcess = {
      send: sinon.spy(),
      on: sinon.stub(),
      kill: sinon.spy(),
      pid: PLUGIN_PID,
    }

    sinon.stub(cp, 'fork').returns(pluginsProcess)

    ipc = {
      send: sinon.spy(),
      on: sinon.stub(),
    }

    sinon.stub(util, 'wrapIpc').returns(ipc)
  })

  context('#init', () => {
    it('uses noop plugins file if no pluginsFile', () => {
      // have to fire "loaded" message, otherwise plugins.init promise never resolves
      ipc.on.withArgs('loaded').yields([])

      return plugins.init({}, getOptions()) // doesn't reject or time out
      .then(() => {
        expect(cp.fork).to.be.called
        expect(cp.fork.lastCall.args[0]).to.contain('plugins/child/index.js')

        const args = cp.fork.lastCall.args[1]

        expect(args[0]).to.equal('--file')
        expect(args[1]).to.include('plugins/child/default_plugins_file.js')
        expect(args[2]).to.equal('--projectRoot')
        expect(args[3]).to.equal('/path/to/project/root')
      })
    })

    it('forks child process', () => {
      // have to fire "loaded" message, otherwise plugins.init promise never resolves
      ipc.on.withArgs('loaded').yields([])

      return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
      .then(() => {
        expect(cp.fork).to.be.called
        expect(cp.fork.lastCall.args[0]).to.contain('plugins/child/index.js')

        expect(cp.fork.lastCall.args[1]).to.eql(['--file', 'cypress-plugin', '--projectRoot', '/path/to/project/root'])
      })
    })

    it('uses system Node when available', () => {
      ipc.on.withArgs('loaded').yields([])
      const systemNode = '/my/path/to/system/node'
      const config = {
        pluginsFile: 'cypress-plugin',
        resolvedNodeVersion: 'v1.2.3',
        resolvedNodePath: systemNode,
      }

      return plugins.init(config, getOptions())
      .then(() => {
        const options = {
          stdio: 'pipe',
          execPath: systemNode,
        }

        expect(omit(cp.fork.lastCall.args[2], 'env')).to.eql(options)
      })
    })

    it('uses bundled Node when cannot find system Node', () => {
      ipc.on.withArgs('loaded').yields([])
      const config = {
        pluginsFile: 'cypress-plugin',
        resolvedNodeVersion: 'v1.2.3',
      }

      return plugins.init(config, getOptions())
      .then(() => {
        const options = {
          stdio: 'pipe',
        }

        expect(omit(cp.fork.lastCall.args[2], 'env')).to.eql(options)
      })
    })

    it('calls any handlers registered with the wrapped ipc', () => {
      ipc.on.withArgs('loaded').yields([])
      const handler = sinon.spy()

      plugins.registerHandler(handler)

      return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
      .then(() => {
        expect(handler).to.be.called
        expect(handler.lastCall.args[0].send).to.be.a('function')

        expect(handler.lastCall.args[0].on).to.be.a('function')
      })
    })

    it('sends \'load\' event with config via ipc once it receives \'ready\'', () => {
      const config = { pluginsFile: 'cypress-plugin', testingType: 'e2e' }

      plugins.init(config, getOptions({ testingType: 'e2e' }))

      expect(ipc.send).to.not.be.called

      // simulate async ready event
      ipc.on.withArgs('ready').firstCall.callback()

      expect(ipc.send).to.be.calledWith('load', {
        ...config,
        ...configExtras,
      })
    })

    it('resolves once it receives \'loaded\' message', () => {
      ipc.on.withArgs('loaded').yields([])

      // should resolve and not time out
      return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
    })

    it('kills child process if it already exists', () => {
      ipc.on.withArgs('loaded').yields([])

      return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
      .then(() => {
        return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
      }).then(() => {
        expect(pluginsProcess.kill).to.be.calledOnce
      })
    })

    describe('loaded message', () => {
      let config

      beforeEach(() => {
        config = {}

        ipc.on.withArgs('loaded').yields(config, [{
          event: 'some:event',
          eventId: 0,
        }])

        return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
      })

      it('sends \'execute\' message when event is executed, wrapped in promise', () => {
        sinon.stub(util, 'wrapParentPromise').resolves('value').yields('00')

        return plugins.execute('some:event', 'foo', 'bar').then((value) => {
          expect(util.wrapParentPromise).to.be.called
          expect(ipc.send).to.be.calledWith(
            'execute',
            'some:event',
            { eventId: 0, invocationId: '00' },
            ['foo', 'bar'],
          )

          expect(value).to.equal('value')
        })
      })
    })

    //
    describe('load:error message', () => {
      context('PLUGINS_FILE_ERROR', () => {
        beforeEach(() => {
          const e = new Error('some error')

          e.stack = 'error message stack'
          ipc.on.withArgs('load:error').yields('PLUGINS_FILE_ERROR', 'path/to/pluginsFile.js', e)
        })

        it('rejects plugins.init', () => {
          return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
          .catch((err) => {
            expect(stripAnsi(err.message)).to.contain('Your pluginsFile is invalid')
            expect(err.message).to.contain('path/to/pluginsFile.js')

            expect(err.details).to.contain('error message stack')
          })
        })
      })

      context('PLUGINS_FUNCTION_ERROR', () => {
        beforeEach(() => {
          const e = new Error()

          e.stack = 'error message stack'
          ipc.on.withArgs('load:error').yields('PLUGINS_FUNCTION_ERROR', 'path/to/pluginsFile.js', e)
        })

        it('rejects plugins.init', () => {
          return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
          .catch((err) => {
            expect(stripAnsi(err.message)).to.contain('Your pluginsFile threw an error from:')
            expect(err.message).to.contain('path/to/pluginsFile.js')

            expect(err.details).to.contain('error message stack')
          })
        })
      })
    })

    describe('error after loaded', () => {
      let err
      let onError

      beforeEach(() => {
        err = {
          name: 'error name',
          message: 'error message',
          stack: 'error stack',
        }

        onError = sinon.spy()
        ipc.on.withArgs('loaded').yields([])

        return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions({ onError }), ctx)
      })

      it('kills the plugins process when plugins process errors', () => {
        pluginsProcess.on.withArgs('error').yield(err)

        expect(pluginsProcess.kill).to.be.called
      })

      it('kills the plugins process when ipc sends error', () => {
        ipc.on.withArgs('error').yield(err)

        expect(pluginsProcess.kill).to.be.called
      })

      it('calls onError when plugins process errors', () => {
        pluginsProcess.on.withArgs('error').yield(err)
        expect(onError).to.be.called
        expect(onError.lastCall.args[0].title).to.equal('Config process error')
        expect(stripAnsi(onError.lastCall.args[0].message)).to.include('Your pluginsFile threw an error from:')

        expect(onError.lastCall.args[0].details).to.include(err.stack)
      })

      it('calls onError when ipc sends error', () => {
        ipc.on.withArgs('error').yield(err)
        expect(onError).to.be.called
        expect(onError.lastCall.args[0].title).to.equal('Config process error')
        expect(stripAnsi(onError.lastCall.args[0].message)).to.include('Your pluginsFile threw an error from:')

        expect(onError.lastCall.args[0].details).to.include(err.stack)
      })
    })

    describe('error before loaded', () => {
      let err

      beforeEach(() => {
        err = {
          name: 'error name',
          message: 'error message',
          stack: 'error stack',
        }

        pluginsProcess.on.withArgs('error').yields(err)
      })

      it('rejects when plugins process errors', () => {
        return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
        .then(() => {
          throw new Error('Should not resolve')
        })
        .catch((_err) => {
          expect(_err.title).to.equal('Config process error')
          expect(stripAnsi(_err.message)).to.include('Your pluginsFile threw an error from:')
          expect(_err.details).to.include(err.stack)
        })
      })

      it('rejects when plugins ipc sends error', () => {
        return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
        .then(() => {
          throw new Error('Should not resolve')
        })
        .catch((_err) => {
          expect(_err.title).to.equal('Config process error')
          expect(stripAnsi(_err.message)).to.include('Your pluginsFile threw an error from:')
          expect(_err.details).to.include(err.stack)
        })
      })
    })

    describe('restore node options', () => {
      let restoreEnv

      afterEach(() => {
        if (restoreEnv) {
          restoreEnv()
          restoreEnv = null
        }
      })

      it('restore NODE_OPTIONS', () => {
        restoreEnv = mockedEnv({
          ORIGINAL_NODE_OPTIONS: '--require foo.js',
        })

        ipc.on.withArgs('loaded').yields([])

        return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
        .then(() => {
          expect(cp.fork.lastCall.args[2].env.NODE_OPTIONS).to.eql('--require foo.js')
        })
      })
    })
  })

  context('#register', () => {
    it('registers callback for event', () => {
      const foo = sinon.spy()

      plugins.registerEvent('foo', foo)
      plugins.execute('foo')

      expect(foo).to.be.called
    })

    it('throws if event is not a string', () => {
      expect(() => {
        plugins.registerEvent()
      }).to.throw('must be called with an event as its 1st argument')
    })

    it('throws if callback is not a function', () => {
      expect(() => {
        plugins.registerEvent('foo')
      }).to.throw('must be called with a callback function as its 2nd argument')
    })
  })

  context('#has', () => {
    it('returns true when event has been registered', () => {
      plugins.registerEvent('foo', () => {})

      expect(plugins.has('foo')).to.be.true
    })

    it('returns false when event has not been registered', () => {
      expect(plugins.has('foo')).to.be.false
    })
  })

  context('#execute', () => {
    it('calls the callback registered for the event', () => {
      const foo = sinon.spy()

      plugins.registerEvent('foo', foo)
      plugins.execute('foo', 'arg1', 'arg2')

      expect(foo).to.be.calledWith('arg1', 'arg2')
    })
  })

  context('#getPluginPid', () => {
    it('returns the pid if there is a plugins process', () => {
      ipc.on.withArgs('loaded').yields([])

      return plugins.init({ pluginsFile: 'cypress-plugin' }, getOptions())
      .then(() => {
        expect(plugins.getPluginPid()).to.eq(PLUGIN_PID)
      })
    })

    it('returns undefined if there is no plugins process', () => {
      expect(plugins.getPluginPid()).to.be.undefined
    })
  })
})
