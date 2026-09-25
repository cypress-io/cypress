import { createRequire } from 'node:module'
import _ from 'lodash'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import * as preprocessor from '../../../../lib/plugins/child/preprocessor'
import * as util from '../../../../lib/plugins/util'
import * as resolve from '../../../../lib/util/resolve'
import browserUtils from '../../../../lib/browsers/utils'
import { RunPlugins } from '../../../../lib/plugins/child/run_plugins'
import * as crossOrigin from '../../../../lib/plugins/child/cross_origin'

const requireCjs = createRequire(import.meta.url)
const webpackPreprocessorPath = requireCjs.resolve('@cypress/webpack-batteries-included-preprocessor')

// run_plugins pulls the preprocessor in with a lazy `require()`, and vite-node hands modules a
// plain node `require`, so `vi.mock()` never sees it. The CJS cache is the seam that does work.
const registerWebpackPreprocessorMock = (mock: unknown) => {
  requireCjs.cache[webpackPreprocessorPath] = { exports: mock } as NodeModule
}

describe('lib/plugins/child/run_plugins', () => {
  let ipc: { send: Mock, on: Mock, removeListener: Mock }
  let runPlugins

  const sentPayload = (event: string) => ipc.send.mock.calls.find((call) => call[0] === event)?.[1]

  const yieldExecutePlugins = (event: string, ids: unknown, args?: unknown[]) => {
    const listener = ipc.on.mock.calls.find((call) => call[0] === 'execute:plugins')?.[1]

    listener(event, ids, args)
  }

  beforeEach(() => {
    ipc = {
      send: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    }

    runPlugins = new RunPlugins(ipc as never, 'proj-root', 'cypress.config.js')
  })

  afterEach(() => {
    delete requireCjs.cache[webpackPreprocessorPath]
    vi.restoreAllMocks()
  })

  describe('#runSetupNodeEvents', () => {
    let config
    let setupNodeEventsFn

    beforeEach(() => {
      config = { projectRoot: '/project/root' }

      setupNodeEventsFn = vi.fn((on) => {
        on('after:screenshot', () => {})
        on('task', {})

        return { includeShadowDom: true }
      })
    })

    describe('#load', () => {
      it('calls setupNodeEventsFn with `registerChildEvent` function and initial config', async () => {
        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        expect(setupNodeEventsFn).toHaveBeenCalledWith(expect.any(Function), config)
      })

      it('registers default preprocessor if none registered by user', async () => {
        const webpackPreprocessorFn = vi.fn()
        const webpackPreprocessor = vi.fn().mockReturnValue(webpackPreprocessorFn)

        vi.spyOn(resolve, 'typescript').mockReturnValue('/path/to/typescript.js')
        registerWebpackPreprocessorMock(webpackPreprocessor)

        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        const registrations = sentPayload('setupTestingType:reply').registrations

        expect(webpackPreprocessor).toHaveBeenCalledWith({
          typescript: '/path/to/typescript.js',
        })

        expect(_.last(registrations)).toEqual({
          event: 'file:preprocessor',
          eventId: 5,
        })

        yieldExecutePlugins('file:preprocessor', { eventId: 5, invocationId: '00' }, ['arg1', 'arg2'])
        expect(webpackPreprocessorFn, 'webpackPreprocessor').toHaveBeenCalled()
      })

      it('does not register default preprocessor if registered by user', async () => {
        const userPreprocessorFn = vi.fn()
        const webpackPreprocessor = vi.fn()

        vi.spyOn(resolve, 'typescript').mockReturnValue('/path/to/typescript.js')

        const setupNodeEventsFn = (on) => {
          on('after:screenshot', () => {})
          on('file:preprocessor', userPreprocessorFn)
          on('task', {})

          return config
        }

        registerWebpackPreprocessorMock(webpackPreprocessor)
        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        const registrations = sentPayload('setupTestingType:reply').registrations

        expect(webpackPreprocessor).not.toHaveBeenCalled()

        expect(registrations[4]).toEqual({
          event: 'file:preprocessor',
          eventId: 4,
        })

        yieldExecutePlugins('file:preprocessor', { eventId: 4, invocationId: '00' }, ['arg1', 'arg2'])
        expect(userPreprocessorFn).toHaveBeenCalled()
      })

      it(`sends 'setupTestingType:reply' event with modified config, registrations, and requires`, async () => {
        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        expect(ipc.send).toHaveBeenCalledWith('setupTestingType:reply', expect.anything())

        const { setupConfig, registrations, requires } = sentPayload('setupTestingType:reply')

        expect(setupConfig).toEqual({ includeShadowDom: true })

        expect(registrations).toHaveLength(6)
        expect(_.map(registrations, 'event')).toEqual([
          '_get:task:body',
          '_get:task:keys',
          '_process:cross:origin:callback',
          'after:screenshot',
          'task',
          'file:preprocessor',
        ])

        expect(requires).toBeInstanceOf(Array)
      })

      it('sends error if setupNodeEvents function rejects the promise', async () => {
        const err = new Error('foo')
        const setupNodeEventsFn = vi.fn().mockRejectedValue(err)

        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        expect(ipc.send).toHaveBeenCalledWith('setupTestingType:error', expect.anything())

        const error = sentPayload('setupTestingType:error')

        expect(error.originalError.message).toBe('foo')
      })
    })

    describe(`on 'execute:plugins' message`, () => {
      let onFilePreprocessor
      let afterBrowserLaunch
      let beforeBrowserLaunch
      let taskRequested
      let setupNodeEventsFn

      beforeEach(async () => {
        vi.spyOn(preprocessor, 'wrap').mockImplementation(() => {})

        onFilePreprocessor = vi.fn().mockResolvedValue(undefined)
        afterBrowserLaunch = vi.fn().mockResolvedValue(undefined)
        beforeBrowserLaunch = vi.fn().mockResolvedValue(undefined)
        taskRequested = vi.fn().mockResolvedValue('foo')

        setupNodeEventsFn = (on) => {
          on('file:preprocessor', onFilePreprocessor)
          on('after:browser:launch', afterBrowserLaunch)
          on('before:browser:launch', beforeBrowserLaunch)
          on('task', taskRequested)
        }
      })

      describe('file:preprocessor', () => {
        const ids = { eventId: 0, invocationId: '00' }
        const args = ['arg1', 'arg2']

        beforeEach(async () => {
          await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

          yieldExecutePlugins('file:preprocessor', ids, args)
        })

        it('calls preprocessor handler', () => {
          expect(preprocessor.wrap).toHaveBeenCalled()

          const lastCall = vi.mocked(preprocessor.wrap).mock.lastCall

          expect(lastCall?.[0]).toBe(ipc)
          expect(lastCall?.[1]).toBeTypeOf('function')
          expect(lastCall?.[2]).toBe(ids)
          expect(lastCall?.[3]).toBe(args)
        })

        it('invokes registered function when invoked by handler', () => {
          vi.mocked(preprocessor.wrap).mock.lastCall?.[1](3, ['one', 'two'])

          expect(onFilePreprocessor).toHaveBeenCalledWith('one', 'two')
        })
      })

      describe('before:browser:launch', () => {
        let args
        const ids = { eventId: 1, invocationId: '00' }

        beforeEach(async () => {
          vi.spyOn(util, 'wrapChildPromise').mockImplementation(() => undefined as never)

          await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

          const browser = {}
          const launchOptions = browserUtils.getDefaultLaunchOptions({})

          args = [browser, launchOptions]

          yieldExecutePlugins('before:browser:launch', ids, args)
        })

        it('wraps child promise', () => {
          expect(util.wrapChildPromise).toHaveBeenCalledWith(ipc, expect.any(Function), ids, args)
        })

        it('invokes registered function when invoked by handler', () => {
          const call = vi.mocked(util.wrapChildPromise).mock.calls.find((c) => c[0] === ipc && c[2] === ids && c[3] === args)

          call?.[1](5, args)

          expect(beforeBrowserLaunch).toHaveBeenCalledWith(...args)
        })
      })

      describe('after:browser:launch', () => {
        let args
        const ids = { eventId: 2, invocationId: '00' }

        beforeEach(async () => {
          vi.spyOn(util, 'wrapChildPromise').mockImplementation(() => undefined as never)

          await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

          const browser = {}
          const launchOptions = browserUtils.getDefaultLaunchOptions({})

          args = [browser, launchOptions]

          yieldExecutePlugins('after:browser:launch', ids, args)
        })

        it('wraps child promise', () => {
          expect(util.wrapChildPromise).toHaveBeenCalled()

          const lastCall = vi.mocked(util.wrapChildPromise).mock.lastCall

          expect(lastCall?.[0]).toBe(ipc)
          expect(lastCall?.[1]).toBeTypeOf('function')
          expect(lastCall?.[2]).toBe(ids)
          expect(lastCall?.[3]).toBe(args)
        })

        it('invokes registered function when invoked by handler', () => {
          vi.mocked(util.wrapChildPromise).mock.lastCall?.[1](4, args)

          expect(afterBrowserLaunch).toHaveBeenCalledWith(...args)
        })
      })

      describe('_process:cross:origin:callback', () => {
        it('calls processCallback with args', async () => {
          const ids = { eventId: '2' }

          vi.spyOn(crossOrigin, 'processCallback').mockImplementation(() => undefined as never)

          await runPlugins.runSetupNodeEvents({}, setupNodeEventsFn)
          await runPlugins.execute('_process:cross:origin:callback', ids, ['arg1', 'arg2'])

          expect(crossOrigin.processCallback).toHaveBeenCalledWith('arg1', 'arg2')
        })
      })
    })
  })

  describe('#invoke', () => {
    it('calls the handler for the specified eventId with the specified args', () => {
      const handler = vi.fn()

      runPlugins.registeredEventsById['id-1'] = { handler }
      runPlugins.invoke('id-1', [1, 2, 3])

      expect(handler).toHaveBeenCalledWith(1, 2, 3)
    })
  })

  describe('tasks', () => {
    const events = {
      'the:task': vi.fn(() => 'result 1'),
      'another:task': vi.fn(() => 'result 2'),
      'a:third:task' () {
        return 'foo'
      },
    }
    const ids = {}

    beforeEach(async () => {
      vi.spyOn(util, 'wrapChildPromise').mockImplementation(() => undefined as never)

      const setupNodeEventsFn = vi.fn((on) => {
        on('task', events)
      })

      await runPlugins.runSetupNodeEvents({}, setupNodeEventsFn)
    })

    describe('.taskGetBody', () => {
      it('returns the stringified body of the event handler', () => {
        runPlugins.taskGetBody(ids, ['a:third:task'])
        expect(util.wrapChildPromise).toHaveBeenCalled()
        const result = vi.mocked(util.wrapChildPromise).mock.lastCall?.[1]('1')

        // the handler is stringified after esbuild transpiles this spec, so it reads back double-quoted
        expect(result.replace(/\s+/g, '')).toBe('"a:third:task"(){return"foo";}')
      })

      it('returns an empty string if event handler cannot be found', () => {
        runPlugins.taskGetBody(ids, ['non:existent'])
        expect(util.wrapChildPromise).toHaveBeenCalled()
        const result = vi.mocked(util.wrapChildPromise).mock.lastCall?.[1]('1')

        expect(result).toBe('')
      })
    })

    describe('.taskGetKeys', () => {
      it('returns the registered task keys', () => {
        runPlugins.taskGetKeys(ids)
        expect(util.wrapChildPromise).toHaveBeenCalled()
        const result = vi.mocked(util.wrapChildPromise).mock.lastCall?.[1]('1')

        expect(result).toEqual(['the:task', 'another:task', 'a:third:task'])
      })
    })

    describe('.taskExecute', () => {
      it('passes through ipc and ids', () => {
        runPlugins.taskExecute(ids, ['the:task'])
        expect(util.wrapChildPromise).toHaveBeenCalled()

        const lastCall = vi.mocked(util.wrapChildPromise).mock.lastCall

        expect(lastCall?.[0]).toBe(ipc)
        expect(lastCall?.[2]).toBe(ids)
      })

      it('invokes the callback for the given task if it exists and returns the result', () => {
        runPlugins.taskExecute(ids, ['the:task', 'the:arg'])

        const result = vi.mocked(util.wrapChildPromise).mock.lastCall?.[1]('3', ['the:arg'])

        expect(events['the:task']).toHaveBeenCalledWith('the:arg')
        expect(result).toBe('result 1')
      })

      it('returns __cypress_unhandled__ if the task does not exist', () => {
        runPlugins.taskExecute(ids, ['nope'])

        expect(vi.mocked(util.wrapChildPromise).mock.lastCall?.[1]('1')).toBe('__cypress_unhandled__')
      })
    })
  })
})
