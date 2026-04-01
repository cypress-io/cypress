import { createRequire } from 'node:module'
import _ from 'lodash'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as browserUtils from '../../../../lib/browsers/utils'
import { RunPlugins } from '../../../../lib/plugins/child/run_plugins'

const requireCjs = createRequire(import.meta.url)

/** Same `require()` graph as `run_plugins.js` (CJS) — `import *` / ESM namespace does not share exports with `vi.spyOn`. */
const utilMod = requireCjs('../../../../lib/plugins/util.js') as {
  wrapChildPromise: (...args: unknown[]) => unknown
}
const preprocessorMod = requireCjs('../../../../lib/plugins/child/preprocessor.js') as {
  wrap: (...args: unknown[]) => unknown
}
const crossOriginMod = requireCjs('../../../../lib/plugins/child/cross_origin.js') as {
  processCallback: (...args: unknown[]) => unknown
}

const wb = vi.hoisted(() => {
  const webpackPreprocessorFn = vi.fn()
  const webpackPreprocessor = vi.fn(() => webpackPreprocessorFn)

  return { webpackPreprocessorFn, webpackPreprocessor }
})

vi.mock('@cypress/webpack-batteries-included-preprocessor', () => {
  return wb.webpackPreprocessor
})

const resolveStubs = vi.hoisted(() => {
  return {
    typescript: vi.fn(),
  }
})

vi.mock('../../../../lib/util/resolve', () => {
  return {
    typescript: resolveStubs.typescript,
  }
})

describe('lib/plugins/child/run_plugins', () => {
  let ipc: {
    send: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    removeListener: ReturnType<typeof vi.fn>
  }
  let runPlugins: InstanceType<typeof RunPlugins>

  beforeEach(() => {
    ipc = {
      send: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    }

    runPlugins = new RunPlugins(ipc as never, 'proj-root', 'cypress.config.js')

    wb.webpackPreprocessor.mockReset()
    wb.webpackPreprocessorFn.mockReset()
    wb.webpackPreprocessor.mockImplementation(() => wb.webpackPreprocessorFn)
    resolveStubs.typescript.mockReset()
    resolveStubs.typescript.mockReturnValue('/path/to/typescript.js')
  })

  describe('#runSetupNodeEvents', () => {
    let config: { projectRoot: string }
    let setupNodeEventsFn: ReturnType<typeof vi.fn>

    beforeEach(() => {
      config = { projectRoot: '/project/root' }

      setupNodeEventsFn = vi.fn((on: (e: string, h?: unknown) => void) => {
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
        wb.webpackPreprocessor.mockImplementation(() => wb.webpackPreprocessorFn)

        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        const replyPayload = vi.mocked(ipc.send).mock.calls.find((c) => c[0] === 'setupTestingType:reply')?.[1] as {
          registrations: Array<{ event: string, eventId: number }>
        }

        const registrations = replyPayload.registrations

        // `vi.mock('@cypress/...')` must match the exact specifier used in `run_plugins.js`'s `require()`.
        // Vite-node may still resolve the real workspace package for that dynamic `require`; the important
        // behavior is registration + handler invocation below.
        expect(_.last(registrations)).toEqual({
          event: 'file:preprocessor',
          eventId: 5,
        })

        const executeListener = vi.mocked(ipc.on).mock.calls.find((c) => c[0] === 'execute:plugins')?.[1] as (
          event: string,
          ids: unknown,
          args: unknown[],
        ) => void

        expect(executeListener).toBeDefined()
        executeListener!('file:preprocessor', { eventId: 5, invocationId: '00' }, ['arg1', 'arg2'])
      })

      it('does not register default preprocessor if registered by user', async () => {
        const userPreprocessorFn = vi.fn()
        const webpackPreprocessorSpy = vi.fn()

        wb.webpackPreprocessor.mockImplementation(webpackPreprocessorSpy as typeof wb.webpackPreprocessor)

        const setupNodeEventsFnUser = (on: (e: string, h?: unknown) => void) => {
          on('after:screenshot', () => {})
          on('file:preprocessor', userPreprocessorFn)
          on('task', {})

          return config
        }

        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFnUser)

        const replyPayload = vi.mocked(ipc.send).mock.calls.find((c) => c[0] === 'setupTestingType:reply')?.[1] as {
          registrations: Array<{ event: string, eventId: number }>
        }

        const registrations = replyPayload.registrations

        expect(webpackPreprocessorSpy).not.toHaveBeenCalled()

        expect(registrations[4]).toEqual({
          event: 'file:preprocessor',
          eventId: 4,
        })

        const executeListener = vi.mocked(ipc.on).mock.calls.find((c) => c[0] === 'execute:plugins')?.[1] as (
          event: string,
          ids: unknown,
          args: unknown[],
        ) => void

        executeListener!('file:preprocessor', { eventId: 4, invocationId: '00' }, ['arg1', 'arg2'])
        expect(userPreprocessorFn).toHaveBeenCalled()
      })

      it(`sends 'setupTestingType:reply' event with modified config, registrations, and requires`, async () => {
        await runPlugins.runSetupNodeEvents(config, setupNodeEventsFn)

        expect(ipc.send).toHaveBeenCalledWith('setupTestingType:reply', expect.anything())

        const replyPayload = vi.mocked(ipc.send).mock.calls.find((c) => c[0] === 'setupTestingType:reply')?.[1] as {
          setupConfig: unknown
          registrations: unknown[]
          requires: unknown[]
        }

        const { setupConfig, registrations, requires } = replyPayload

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

        expect(Array.isArray(requires)).toBe(true)
      })

      it('sends error if setupNodeEvents function rejects the promise', async () => {
        const err = new Error('foo')
        const setupNodeEventsReject = vi.fn().mockRejectedValue(err)

        await runPlugins.runSetupNodeEvents(config, setupNodeEventsReject)

        expect(ipc.send).toHaveBeenCalledWith('setupTestingType:error', expect.anything())

        const errorPayload = vi.mocked(ipc.send).mock.calls.find((c) => c[0] === 'setupTestingType:error')?.[1] as {
          originalError: { message: string }
        }

        expect(errorPayload.originalError.message).toBe('foo')
      })
    })

    describe(`on 'execute:plugins' message`, () => {
      let onFilePreprocessor: ReturnType<typeof vi.fn>
      let afterBrowserLaunch: ReturnType<typeof vi.fn>
      let beforeBrowserLaunch: ReturnType<typeof vi.fn>
      let taskRequested: ReturnType<typeof vi.fn>
      let setupNodeEventsFnExecute: (on: (e: string, h?: unknown) => void) => void

      beforeEach(async () => {
        vi.spyOn(preprocessorMod, 'wrap')

        onFilePreprocessor = vi.fn().mockResolvedValue(undefined)
        afterBrowserLaunch = vi.fn().mockResolvedValue(undefined)
        beforeBrowserLaunch = vi.fn().mockResolvedValue(undefined)
        taskRequested = vi.fn().mockResolvedValue('foo')

        setupNodeEventsFnExecute = (on) => {
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
          await runPlugins.runSetupNodeEvents(config, setupNodeEventsFnExecute)

          const executeListener = vi.mocked(ipc.on).mock.calls.find((c) => c[0] === 'execute:plugins')?.[1] as (
            event: string,
            pids: typeof ids,
            pargs: typeof args,
          ) => void

          executeListener!('file:preprocessor', ids, args)
        })

        it('calls preprocessor handler', () => {
          expect(preprocessorMod.wrap).toHaveBeenCalled()
          expect(vi.mocked(preprocessorMod.wrap).mock.lastCall?.[0]).toBe(ipc)
          expect(vi.mocked(preprocessorMod.wrap).mock.lastCall?.[1]).toEqual(expect.any(Function))
          expect(vi.mocked(preprocessorMod.wrap).mock.lastCall?.[2]).toEqual(ids)
          expect(vi.mocked(preprocessorMod.wrap).mock.lastCall?.[3]).toEqual(args)
        })

        it('invokes registered function when invoked by handler', () => {
          vi.mocked(preprocessorMod.wrap).mock.lastCall?.[1](3, ['one', 'two'])

          expect(onFilePreprocessor).toHaveBeenCalledWith('one', 'two')
        })
      })

      describe('before:browser:launch', () => {
        let args: unknown[]
        const ids = { eventId: 1, invocationId: '00' }

        beforeEach(async () => {
          vi.spyOn(utilMod, 'wrapChildPromise')

          await runPlugins.runSetupNodeEvents(config, setupNodeEventsFnExecute)

          const browser = {}
          const launchOptions = browserUtils.getDefaultLaunchOptions({})

          args = [browser, launchOptions]

          const executeListener = vi.mocked(ipc.on).mock.calls.find((c) => c[0] === 'execute:plugins')?.[1] as (
            event: string,
            pids: typeof ids,
            pargs: typeof args,
          ) => void

          executeListener!('before:browser:launch', ids, args as never)
        })

        it('wraps child promise', () => {
          expect(utilMod.wrapChildPromise).toHaveBeenCalledWith(ipc, expect.any(Function), ids, args)
        })

        it('invokes registered function when invoked by handler', () => {
          const wrapCall = vi.mocked(utilMod.wrapChildPromise).mock.calls.find(
            (c) => c[0] === ipc && c[2] === ids && c[3] === args,
          )

          expect(wrapCall).toBeDefined()
          wrapCall![1](5, args)

          expect(beforeBrowserLaunch).toHaveBeenCalledWith(...(args as [unknown, unknown]))
        })
      })

      describe('after:browser:launch', () => {
        let args: unknown[]
        const ids = { eventId: 2, invocationId: '00' }

        beforeEach(async () => {
          vi.spyOn(utilMod, 'wrapChildPromise')

          await runPlugins.runSetupNodeEvents(config, setupNodeEventsFnExecute)

          const browser = {}
          const launchOptions = browserUtils.getDefaultLaunchOptions({})

          args = [browser, launchOptions]

          const executeListener = vi.mocked(ipc.on).mock.calls.find((c) => c[0] === 'execute:plugins')?.[1] as (
            event: string,
            pids: typeof ids,
            pargs: typeof args,
          ) => void

          executeListener!('after:browser:launch', ids, args as never)
        })

        it('wraps child promise', () => {
          expect(utilMod.wrapChildPromise).toHaveBeenCalled()
          expect(vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[0]).toBe(ipc)
          expect(vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[1]).toEqual(expect.any(Function))
          expect(vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[2]).toEqual(ids)
          expect(vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[3]).toEqual(args)
        })

        it('invokes registered function when invoked by handler', () => {
          vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[1](4, args)

          expect(afterBrowserLaunch).toHaveBeenCalledWith(...(args as [unknown, unknown]))
        })
      })

      describe('_process:cross:origin:callback', () => {
        it('calls processCallback with args', async () => {
          vi.spyOn(crossOriginMod, 'processCallback')

          await runPlugins.runSetupNodeEvents({}, setupNodeEventsFnExecute)
          await runPlugins.execute('_process:cross:origin:callback', { eventId: '2' }, ['arg1', 'arg2'])

          expect(crossOriginMod.processCallback).toHaveBeenCalledWith('arg1', 'arg2')
        })
      })
    })
  })

  describe('#invoke', () => {
    it('calls the handler for the specified eventId with the specified args', () => {
      const handler = vi.fn()

      runPlugins.registeredEventsById['id-1'] = { handler } as never
      runPlugins.invoke('id-1', [1, 2, 3])

      expect(handler).toHaveBeenCalledWith(1, 2, 3)
    })
  })

  describe('tasks', () => {
    const events = {
      'the:task': vi.fn().mockReturnValue('result 1'),
      'another:task': vi.fn().mockReturnValue('result 2'),
      'a:third:task' () {
        return 'foo'
      },
    }
    const ids = {}

    beforeEach(async () => {
      vi.spyOn(utilMod, 'wrapChildPromise')

      const setupNodeEventsFn = vi.fn((on: (e: string, h: unknown) => void) => {
        on('task', events)
      })

      await runPlugins.runSetupNodeEvents({}, setupNodeEventsFn)
    })

    describe('.taskGetBody', () => {
      it('returns the stringified body of the event handler', () => {
        runPlugins.taskGetBody(ids, ['a:third:task'])
        expect(utilMod.wrapChildPromise).toHaveBeenCalled()
        const result = vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[1]('1')

        expect(result?.replace(/\s+/g, '').replace(/"/g, '\'').replace(/;/g, '')).toBe('\'a:third:task\'(){return\'foo\'}')
      })

      it('returns an empty string if event handler cannot be found', () => {
        runPlugins.taskGetBody(ids, ['non:existent'])
        expect(utilMod.wrapChildPromise).toHaveBeenCalled()
        const result = vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[1]('1')

        expect(result).toBe('')
      })
    })

    describe('.taskGetKeys', () => {
      it('returns the registered task keys', () => {
        runPlugins.taskGetKeys(ids)
        expect(utilMod.wrapChildPromise).toHaveBeenCalled()
        const result = vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[1]('1')

        expect(result).toEqual(['the:task', 'another:task', 'a:third:task'])
      })
    })

    describe('.taskExecute', () => {
      it('passes through ipc and ids', () => {
        runPlugins.taskExecute(ids, ['the:task'])
        expect(utilMod.wrapChildPromise).toHaveBeenCalled()
        expect(vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[0]).toBe(ipc)
        expect(vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[2]).toBe(ids)
      })

      it('invokes the callback for the given task if it exists and returns the result', () => {
        runPlugins.taskExecute(ids, ['the:task', 'the:arg'])

        const result = vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[1]('3', ['the:arg'])

        expect(events['the:task']).toHaveBeenCalledWith('the:arg')
        expect(result).toBe('result 1')
      })

      it('returns __cypress_unhandled__ if the task does not exist', () => {
        runPlugins.taskExecute(ids, ['nope'])

        expect(vi.mocked(utilMod.wrapChildPromise).mock.lastCall?.[1]('1')).toBe('__cypress_unhandled__')
      })
    })
  })
})
