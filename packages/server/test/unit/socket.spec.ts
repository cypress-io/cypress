import _ from 'lodash'
import path from 'path'
import httpsAgent from 'https-proxy-agent'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
// NOTE: we need to import the client from the lib directory because the browser/client directory is compiled to ESM.
// we are unable to import ESM into a CommonJS test context, even if we await import() the module.
import * as socketIo from '@packages/socket/lib/client'
import Fixtures from '@tooling/system-tests'
import * as errors from '../../lib/errors'
import { SocketE2E } from '../../lib/socket-e2e'
import { ServerBase } from '../../lib/server-base'
import { Automation } from '../../lib/automation'
import preprocessor from '../../lib/plugins/preprocessor'
import { fs } from '../../lib/util/fs'
import * as session from '../../lib/session'
import devServer from '../../lib/plugins/dev-server'
import * as createRoutes from '../../lib/routes'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../lib/makeDataContext'
import { SocketCt } from '../../lib/socket-ct'
import runEvents from '../../lib/plugins/run_events'
import { GracefulExit } from '../../lib/util/graceful-exit'

// Building the real schemas in this worker loads a second `graphql` realm, which
// `graphql` rejects. No test here issues a GraphQL request.
vi.mock('@packages/data-context/graphql/makeGraphQLServer', () => {
  return {
    graphqlWS: vi.fn(),
    graphQLHTTP: vi.fn(),
  }
})

vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql', () => {
  return { remoteSchemaWrapped: {} }
})

// `GracefulExit.resetForTesting` refuses to clear its singleton without this.
const testGlobals = globalThis as { IS_TEST?: boolean }

testGlobals.IS_TEST = true

// sinon's `calledWith` passes when the leading arguments match, ignoring the rest.
function expectCalledWith (spy: MockInstance, ...args: unknown[]) {
  expect(spy.mock.calls.map((call) => call.slice(0, args.length))).toContainEqual(args)
}

// Invokes the callback of every `on(event, cb)` registration, like sinon's `withArgs(event).yield()`.
function yieldTo (spy: MockInstance, event: string, ...args: unknown[]) {
  const calls = spy.mock.calls.filter(([name]) => name === event)

  expect(calls.length).toBeGreaterThan(0)

  calls.forEach((call) => {
    const callback = call.find((arg) => typeof arg === 'function')

    if (!callback) {
      throw new Error(`${event} was registered without a callback`)
    }

    callback(...args)
  })
}

let ctx

describe('lib/socket', () => {
  let todosPath: string
  let cfg: any
  let server: any
  let options: any
  let automation: any
  let socket: any
  let socketClient: any
  let client: any
  let mockClient: any
  let io: any
  let preprocessorOn: MockInstance
  let preprocessorOff: MockInstance

  beforeEach(async () => {
    GracefulExit.resetForTesting()
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))
  })

  afterEach(async () => {
    await getCtx()._reset()
    await clearCtx()
    vi.restoreAllMocks()
  })

  beforeEach(async () => {
    ctx = getCtx()
    ctx.coreData.activeBrowser = {
      path: 'path-to-browser-one',
    }

    vi.spyOn(ctx.browser, 'machineBrowsers').mockResolvedValue([
      {
        channel: 'stable',
        displayName: 'Electron',
        family: 'chromium',
        majorVersion: '123',
        name: 'electron',
        path: 'path-to-browser-one',
        version: '123.45.67',
      },
    ])

    // Don't bother initializing the child process, etc for this
    vi.spyOn(ctx.actions.project, 'initializeActiveProject').mockReturnValue(undefined)
    preprocessorOn = vi.spyOn(preprocessor.emitter, 'on').mockReturnValue(undefined as any)
    preprocessorOff = vi.spyOn(preprocessor.emitter, 'off').mockReturnValue(undefined as any)

    Fixtures.scaffold()
    session.clearSessions(true)

    todosPath = Fixtures.projectPath('todos')

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(todosPath)

    return ctx.lifecycleManager.getFullInitialConfig()
    .then((_cfg) => {
      cfg = _cfg
      server = new ServerBase(cfg)
    })
  })

  afterEach(() => {
    Fixtures.remove()

    return server.close()
  })

  describe('integration', () => {
    let mockCyPrompt

    beforeEach(() => {
      return new Promise<void>((resolve, reject) => {
        // create a for realz socket.io connection
        // so we can test server emit / client emit events
        server.open(cfg, {
          SocketCtor: SocketE2E,
          createRoutes,
          testingType: 'e2e',
          getCurrentBrowser: () => null,
        })
        // the client below CONNECTs through this server like a proxied browser,
        // which only happens on the MITM path — and the server refuses CONNECT
        // until a launch resolves that path
        .then(() => server.setNetworkMode(false))
        .then(() => {
          options = {
            getSavedState: vi.fn(),
            onSavedStateChanged: vi.fn(),
            onStudioInit: vi.fn(),
            onStudioDestroy: vi.fn(),
            onCyPromptReady: vi.fn(),
          }

          automation = new Automation({
            cyNamespace: cfg.namespace,
            cookieNamespace: cfg.socketIoCookie,
            screenshotsFolder: cfg.screenshotsFolder,
          })

          // Create a mock studio object with addSocketListeners method
          const mockStudio = {
            addSocketListeners: vi.fn(),
          }

          const studioLifecycleManager = {
            registerStudioReadyListener: vi.fn((callback) => {
              callback(mockStudio)

              return () => {}
            }),
          }

          // Create a mock cy prompt object with handleBackendRequest method
          mockCyPrompt = {
            addSocketListeners: vi.fn(),
            status: 'INITIALIZED',
            reset: vi.fn(),
          }

          ctx.coreData.studioLifecycleManager = studioLifecycleManager

          const cyPromptLifecycleManager = {
            getCyPrompt: vi.fn().mockResolvedValue({
              cyPromptManager: mockCyPrompt,
            }),
            resetCyPrompt: vi.fn(() => {
              mockCyPrompt.reset()
            }),
            registerCyPromptReadyListener: vi.fn((callback) => {
              callback(mockCyPrompt)

              return () => {}
            }),
          }

          ctx.coreData.cyPromptLifecycleManager = cyPromptLifecycleManager

          server.startWebsockets(automation, cfg, options)
          socket = server._socket

          const done = _.once(resolve)

          // when our real client connects then we're done
          socket.socketIo.on('connection', (s) => {
            socketClient = s

            return done()
          })

          const { proxyUrl, socketIoRoute } = cfg

          // force node into legit proxy mode like a browser
          const agent = new httpsAgent(`http://localhost:${cfg.port}`)

          client = socketIo.client(proxyUrl, {
            agent,
            path: socketIoRoute,
            transports: ['websocket'],
          })
        })
        .catch(reject)
      })
    })

    afterEach(() => {
      return client.disconnect()
    })

    // https://github.com/cypress-io/cypress/issues/4346
    it('can emit a circular object without crashing', () => {
      return new Promise<void>((done) => {
        const foo: any = {
          bar: {},
        }

        foo.bar.baz = foo

        // stubbing session#getSession here just so we have something that we can
        // control the resolved value of
        vi.spyOn(session, 'getSession').mockResolvedValue(foo)

        return client.emit('backend:request', 'get:session', 'quuz', (res) => {
          expect(res.response).toEqual(foo)

          return done()
        })
      })
    })

    describe('on(automation:push:request)', () => {
      beforeEach(() => {
        return new Promise<void>((done) => {
          socketClient.on('automation:client:connected', () => {
            return done()
          })

          return client.emit('automation:client:connected')
        })
      })

      it('emits \'automation:push:message\'', () => {
        return new Promise<void>((done) => {
          const data = { cause: 'explicit', cookie: { name: 'foo', value: 'bar' }, removed: true }

          const emit = vi.spyOn(socket.socketIo, 'emit').mockReturnValue(undefined)

          return client.emit('automation:push:request', 'change:cookie', data, () => {
            expectCalledWith(emit, 'automation:push:message', 'change:cookie', {
              cookie: { name: 'foo', value: 'bar' },
              message: 'Cookie Removed: \'foo\'',
              removed: true,
            })

            return done()
          })
        })
      })
    })

    describe('on(watch:test:file)', () => {
      it('calls socket#watchTestFileByPath with config, spec argument', () => {
        return new Promise<void>((done) => {
          const watchTestFileByPath = vi.spyOn(socket, 'watchTestFileByPath').mockReturnValue(undefined)

          const specArgument = {}

          return client.emit('watch:test:file', specArgument, () => {
            expectCalledWith(watchTestFileByPath, cfg, specArgument)

            return done()
          })
        })
      })
    })

    describe('on(app:connect)', () => {
      it('calls options.onConnect with socketId and socket', () => {
        return new Promise<void>((done) => {
          options.onConnect = function (socketId, socket) {
            expect(socketId).toBe('sid-123')
            expect(socket.connected).toBe(true)

            return done()
          }

          return client.emit('app:connect', 'sid-123')
        })
      })
    })

    describe('on(mocha)', () => {
      // the driver emits mocha events with a variable number of arguments, so each
      // must reach onMocha individually rather than as one array
      it('forwards every argument to onMocha', () => {
        return new Promise<void>((done) => {
          options.onMocha = function (...args) {
            expect(args).toEqual(['test:before:run', { id: 'r3', title: 'does something' }])

            return done()
          }

          return client.emit('mocha', 'test:before:run', { id: 'r3', title: 'does something' })
        })
      })

      it('forwards a single argument', () => {
        return new Promise<void>((done) => {
          options.onMocha = function (...args) {
            expect(args).toEqual(['start'])

            return done()
          }

          return client.emit('mocha', 'start')
        })
      })
    })

    describe('on(backend:request, get:fixture)', () => {
      it('returns the fixture object', () => {
        return new Promise<void>((done) => {
          const cb = function (resp) {
            expect(resp.response).toEqual([
              { 'json': true },
            ])

            return done()
          }

          return client.emit('backend:request', 'get:fixture', 'foo', cb)
        })
      })

      it('errors when fixtures fails', () => {
        return new Promise<void>((done) => {
          const cb = function (resp) {
            expect(resp.error.message).toContain('A fixture file could not be found')
            expect(resp.error.message).toContain('does-not-exist.txt')

            return done()
          }

          return client.emit('backend:request', 'get:fixture', 'does-not-exist.txt', {}, cb)
        })
      })

      it('passes Buffers through intact', () => {
        return new Promise<void>((done) => {
          const cb = function (resp) {
            expect(resp.response).toEqual(Buffer.from('[{"json": true}]'))

            return done()
          }

          return client.emit('backend:request', 'get:fixture', 'foo', { encoding: null }, cb)
        })
      })
    })

    describe('on(backend:request, http:request)', () => {
      it('calls socket#onRequest', () => {
        return new Promise<void>((done) => {
          options.onRequest = vi.fn().mockResolvedValue({ foo: 'bar' })

          return client.emit('backend:request', 'http:request', 'foo', (resp) => {
            expect(resp.response).toEqual({ foo: 'bar' })

            return done()
          })
        })
      })

      it('catches errors and clones them', () => {
        return new Promise<void>((done) => {
          const err = new Error('foo bar baz')

          options.onRequest = vi.fn().mockRejectedValue(err)

          return client.emit('backend:request', 'http:request', 'foo', (resp) => {
            expect(resp.error).toEqual(errors.cloneErr(err))

            return done()
          })
        })
      })
    })

    describe('on(backend:request, reset:server:state)', () => {
      it('forwards the per-test options to options.onResetServerState', () => {
        return new Promise<void>((done) => {
          options.onResetServerState = vi.fn()

          return client.emit('backend:request', 'reset:server:state', { blockHosts: ['*.pendo.io'] }, (resp) => {
            expectCalledWith(options.onResetServerState, { blockHosts: ['*.pendo.io'] })
            expect(resp.response).toBeUndefined()

            return done()
          })
        })
      })
    })

    describe('on(backend:request, wait:for:prompt:ready)', () => {
      it('awaits cy prompt ready and returns true if cy prompt is ready', () => {
        return new Promise<void>((done) => {
          const mockCyPrompt = {
            cyPromptManager: {
              status: 'INITIALIZED',
            },
            error: undefined,
          }

          ctx.coreData.cyPromptLifecycleManager.getCyPrompt.mockResolvedValue(mockCyPrompt)

          return client.emit('backend:request', 'wait:for:prompt:ready', (resp) => {
            expect(resp.response).toEqual({ success: true })

            expectCalledWith(options.onCyPromptReady, mockCyPrompt.cyPromptManager)

            return done()
          })
        })
      })

      it('awaits cy prompt ready and returns false if cy prompt is not ready', () => {
        return new Promise<void>((done) => {
          const mockCyPrompt = {
            cyPromptManager: {
              status: 'NOT_INITIALIZED',
            },
            error: undefined,
          }

          ctx.coreData.cyPromptLifecycleManager.getCyPrompt.mockResolvedValue(mockCyPrompt)

          return client.emit('backend:request', 'wait:for:prompt:ready', (resp) => {
            expect(resp.response).toEqual({ success: false })

            return done()
          })
        })
      })

      it('awaits cy prompt ready and returns error if cy prompt error is thrown', () => {
        return new Promise<void>((done) => {
          const mockCyPrompt = {
            cyPromptManager: undefined,
            error: new Error('not loaded'),
          }

          ctx.coreData.cyPromptLifecycleManager.getCyPrompt.mockResolvedValue(mockCyPrompt)

          return client.emit('backend:request', 'wait:for:prompt:ready', (resp) => {
            expect(resp.response).toEqual({
              error: errors.cloneErr(mockCyPrompt.error),
            })

            return done()
          })
        })
      })

      it('returns false if the cy prompt lifecycle manager was never initialized', () => {
        return new Promise<void>((done) => {
          ctx.coreData.cyPromptLifecycleManager = undefined

          return client.emit('backend:request', 'wait:for:prompt:ready', (resp) => {
            expect(resp.response).toEqual({ success: false })

            return done()
          })
        })
      })
    })

    describe('on(get:app:state)', () => {
      it('calls getSavedState with options and returns the state', () => {
        return new Promise<void>((done) => {
          options.getSavedState.mockResolvedValue({ reporterWidth: 500 })

          client.emit('get:app:state', { type: 'global' }, (resp) => {
            expectCalledWith(options.getSavedState, { type: 'global' })
            expect(resp.data).toEqual({ reporterWidth: 500 })

            done()
          })
        })
      })

      it('handles errors thrown by getSavedState', () => {
        return new Promise<void>((done) => {
          const err = new Error('boom')

          options.getSavedState.mockRejectedValue(err)

          client.emit('get:app:state', { type: 'global' }, (resp) => {
            expectCalledWith(options.getSavedState, { type: 'global' })
            expect(resp.error).toEqual(errors.cloneErr(err))

            done()
          })
        })
      })
    })

    describe('on(save:app:state)', () => {
      it('calls onSavedStateChanged with the state and options', () => {
        return new Promise<void>((done) => {
          client.emit('save:app:state', { reporterWidth: 500, __options: { type: 'global' } }, () => {
            expectCalledWith(options.onSavedStateChanged, { reporterWidth: 500 }, { type: 'global' })

            done()
          })
        })
      })
    })

    describe('on(studio:init)', () => {
      it('calls onStudioInit', async () => {
        options.onStudioInit.mockResolvedValue({ canAccessStudioAI: true, cloudStudioSessionId: 'test-session-id' })

        await new Promise<void>((resolve) => {
          client.emit('studio:init', {}, ({ canAccessStudioAI, cloudStudioSessionId }) => {
            expect(options.onStudioInit).toHaveBeenCalled()
            expect(canAccessStudioAI).toBe(true)
            expect(cloudStudioSessionId).toBe('test-session-id')

            resolve()
          })
        })
      })

      it('calls onStudioInit and handles undefined cloudStudioSessionId', async () => {
        options.onStudioInit.mockResolvedValue({ canAccessStudioAI: false, cloudStudioSessionId: undefined })

        await new Promise<void>((resolve) => {
          client.emit('studio:init', {}, ({ canAccessStudioAI, cloudStudioSessionId }) => {
            expect(options.onStudioInit).toHaveBeenCalled()
            expect(canAccessStudioAI).toBe(false)
            expect(cloudStudioSessionId).toBeUndefined()

            resolve()
          })
        })
      })

      it('passes through options to onStudioInit', async () => {
        const sessionId = 'test-session-id'

        options.onStudioInit.mockResolvedValue({ canAccessStudioAI: false, cloudStudioSessionId: sessionId })

        await new Promise<void>((resolve) => {
          client.emit('studio:init', { sessionId }, ({ canAccessStudioAI, cloudStudioSessionId }) => {
            expectCalledWith(options.onStudioInit, { sessionId })
            expect(canAccessStudioAI).toBe(false)
            expect(cloudStudioSessionId).toBe(sessionId)

            resolve()
          })
        })
      })

      it('handles errors thrown by onStudioInit', async () => {
        options.onStudioInit.mockRejectedValue(new Error('foo'))

        await new Promise<void>((resolve) => {
          client.emit('studio:init', {}, ({ error }) => {
            expect(options.onStudioInit).toHaveBeenCalled()
            expect(error.message).toBe('foo')

            resolve()
          })
        })
      })
    })

    describe('on(studio:destroy)', () => {
      it('calls onStudioDestroy', async () => {
        options.onStudioDestroy.mockResolvedValue(undefined)

        await new Promise<void>((resolve) => {
          client.emit('studio:destroy', () => {
            expect(options.onStudioDestroy).toHaveBeenCalled()

            resolve()
          })
        })
      })

      it('handles errors thrown by onStudioDestroy', async () => {
        options.onStudioDestroy.mockRejectedValue(new Error('foo'))

        await new Promise<void>((resolve) => {
          client.emit('studio:destroy', ({ error }) => {
            expect(options.onStudioDestroy).toHaveBeenCalled()
            expect(error.message).toBe('foo')

            resolve()
          })
        })
      })
    })

    describe('on(prompt:reset)', () => {
      it('calls reset', async () => {
        await new Promise<void>((resolve) => {
          client.emit('prompt:reset', () => {
            expect(ctx.coreData.cyPromptLifecycleManager.resetCyPrompt).toHaveBeenCalled()
            expect(mockCyPrompt.reset).toHaveBeenCalled()

            resolve()
          })
        })
      })

      it('does not call reset if there is runState', async () => {
        await new Promise<void>((resolve) => {
          client.emit('backend:request', 'preserve:run:state', {}, () => {
            resolve()
          })
        })

        await new Promise<void>((resolve) => {
          client.emit('prompt:reset', () => {
            expect(ctx.coreData.cyPromptLifecycleManager.resetCyPrompt).not.toHaveBeenCalled()
            expect(mockCyPrompt.reset).not.toHaveBeenCalled()

            resolve()
          })
        })
      })
    })

    describe('studio.addSocketListeners', () => {
      it('calls addSocketListeners on studio when socket connects', async () => {
        preprocessorOn.mockClear()

        // Verify that registerStudioReadyListener was called
        expect(ctx.coreData.studioLifecycleManager.registerStudioReadyListener).toHaveBeenCalled()

        // Check that the callback was called with the mock studio object
        const registerStudioReadyListenerCallback = ctx.coreData.studioLifecycleManager.registerStudioReadyListener.mock.calls[0][0]

        expect(registerStudioReadyListenerCallback).toBeTypeOf('function')

        // Verify the mock studio's addSocketListeners was called by the callback
        const mockStudio = { addSocketListeners: vi.fn() }

        registerStudioReadyListenerCallback(mockStudio)
        expect(mockStudio.addSocketListeners).toHaveBeenCalled()

        const addSocketListenersOptions = mockStudio.addSocketListeners.mock.calls[0][0]

        expect(Object.prototype.toString.call(addSocketListenersOptions)).toBe('[object Object]')
        expect(addSocketListenersOptions).toHaveProperty('socket')
        expect(addSocketListenersOptions).toHaveProperty('onAfterSave')
        expect(addSocketListenersOptions).toHaveProperty('onBeforeSave')

        const onBeforeSave = addSocketListenersOptions.onBeforeSave

        cfg.watchForFileChanges = false

        onBeforeSave()

        expectCalledWith(preprocessorOn, 'file:updated')

        const preprocessorCallback = preprocessorOn.mock.calls[0][1]

        const emit = vi.spyOn(socket._socketIo, 'emit').mockReturnValue(undefined)

        vi.spyOn(fs, 'statAsync').mockResolvedValue(undefined)

        await preprocessorCallback()

        expectCalledWith(emit, 'watched:file:changed')

        emit.mockClear()
      })
    })

    describe('cy.prompt.addSocketListeners', () => {
      it('calls addSocketListeners on cy prompt when socket connects', async () => {
        preprocessorOn.mockClear()

        // Verify that registerCyPromptReadyListener was called
        expect(ctx.coreData.cyPromptLifecycleManager.registerCyPromptReadyListener).toHaveBeenCalled()

        const registerCyPromptReadyListenerCallback = ctx.coreData.cyPromptLifecycleManager.registerCyPromptReadyListener.mock.calls[0][0]

        expect(registerCyPromptReadyListenerCallback).toBeTypeOf('function')

        const mockCyPrompt = { addSocketListeners: vi.fn() }

        registerCyPromptReadyListenerCallback(mockCyPrompt)
        expect(mockCyPrompt.addSocketListeners).toHaveBeenCalled()

        const addSocketListenersOptions = mockCyPrompt.addSocketListeners.mock.calls[0][0]

        expect(Object.prototype.toString.call(addSocketListenersOptions)).toBe('[object Object]')
        expect(addSocketListenersOptions).toHaveProperty('socket')
        expect(addSocketListenersOptions).toHaveProperty('onAfterSave')
        expect(addSocketListenersOptions).toHaveProperty('onBeforeSave')

        const onBeforeSave = addSocketListenersOptions.onBeforeSave

        cfg.watchForFileChanges = false

        onBeforeSave()

        expectCalledWith(preprocessorOn, 'file:updated')

        const preprocessorCallback = preprocessorOn.mock.calls[0][1]

        const emit = vi.spyOn(socket._socketIo, 'emit').mockReturnValue(undefined)

        vi.spyOn(fs, 'statAsync').mockResolvedValue(undefined)

        await preprocessorCallback()

        expectCalledWith(emit, 'watched:file:changed')

        emit.mockClear()
      })
    })

    describe('#isRunnerSocketConnected', () => {
      it('returns false when runner is not connected', () => {
        expect(socket.isRunnerSocketConnected()).toBe(false)
      })

      describe('runner connected', () => {
        beforeEach(() => {
          return new Promise<void>((done) => {
            socketClient.on('automation:client:connected', () => {
              socketClient.on('runner:connected', () => {
                return done()
              })

              client.emit('runner:connected')
            })

            return client.emit('automation:client:connected')
          })
        })

        it('returns true when runner is connected', () => {
          expect(socket.isRunnerSocketConnected()).toBe(true)
        })
      })
    })

    describe('on(backend:request, save:session)', () => {
      it('saves spec sessions', () => {
        return new Promise<void>((done) => {
          const sessionData = {
            id: 'spec',
            cacheAcrossSpecs: false,
          }

          client.emit('backend:request', 'save:session', sessionData, () => {
            const state = session.getState()

            expect(state).toEqual({
              globalSessions: {},
              specSessions: {
                'spec': sessionData,
              },
            })

            done()
          })
        })
      })

      it('saves global sessions', () => {
        return new Promise<void>((done) => {
          const sessionData = {
            id: 'global',
            cacheAcrossSpecs: true,
          }

          client.emit('backend:request', 'save:session', sessionData, () => {
            const state = session.getState()

            expect(state).toEqual({
              globalSessions: {
                'global': sessionData,
              },
              specSessions: {},
            })

            done()
          })
        })
      })

      it('returns error if session data has no id', () => {
        return new Promise<void>((done) => {
          const sessionData = {}

          client.emit('backend:request', 'save:session', sessionData, ({ error }) => {
            expect(error.message).toBe('session data had no id')
            done()
          })
        })
      })
    })

    describe('on(backend:request, clear:sessions)', () => {
      it('clears spec sessions', () => {
        return new Promise<void>((done) => {
          let state: any = session.getState()

          state.globalSessions = {
            global: { id: 'global' },
          }

          state.specSessions = {
            spec: { id: 'spec' },
          }

          client.emit('backend:request', 'clear:sessions', false, () => {
            expect(state).toEqual({
              globalSessions: {
                'global': { id: 'global' },
              },
              specSessions: {},
            })

            done()
          })
        })
      })

      it('clears all sessions', () => {
        return new Promise<void>((done) => {
          let state: any = session.getState()

          state.globalSessions = {
            global: { id: 'global' },
          }

          state.specSessions = {
            spec: { id: 'spec' },
          }

          client.emit('backend:request', 'clear:sessions', true, () => {
            expect(state).toEqual({
              globalSessions: {},
              specSessions: {},
            })

            done()
          })
        })
      })
    })

    describe('on(backend:request, get:session)', () => {
      it('returns global session', () => {
        return new Promise<void>((done) => {
          const state: any = session.getState()

          state.globalSessions = {
            global: { id: 'global' },
          }

          client.emit('backend:request', 'get:session', 'global', ({ response, error }) => {
            expect(error).toBeUndefined()
            expect(response).toEqual({
              id: 'global',
            })

            done()
          })
        })
      })

      it('returns spec session', () => {
        return new Promise<void>((done) => {
          const state: any = session.getState()

          state.globalSessions = {}
          state.specSessions = {
            'spec': { id: 'spec' },
          }

          client.emit('backend:request', 'get:session', 'spec', ({ response, error }) => {
            expect(error).toBeUndefined()
            expect(response).toEqual({
              id: 'spec',
            })

            done()
          })
        })
      })

      it('returns error when session does not exist', () => {
        return new Promise<void>((done) => {
          const state = session.getState()

          state.globalSessions = {}
          state.specSessions = {}
          client.emit('backend:request', 'get:session', 1, ({ response, error }) => {
            expect(response).toBeUndefined()
            expect(error.message).toBe('session with id "1" not found')

            done()
          })
        })
      })
    })

    describe('on(backend:request, reset:cached:test:state)', () => {
      it('clears spec sessions', () => {
        return new Promise<void>((done) => {
          const state: any = session.getState()

          state.globalSessions = {
            global: { id: 'global' },
          }

          state.specSessions = {
            local: { id: 'local' },
          }

          client.emit('backend:request', 'reset:cached:test:state', ({ error }) => {
            expect(error).toBeUndefined()

            expect(state).toEqual({
              globalSessions: {
                'global': { id: 'global' },
              },
              specSessions: {},
            })

            done()
          })
        })
      })
    })

    describe('on(get:cached:test:state)', () => {
      it('returns cached test state', async () => {
        await new Promise((resolve) => {
          client.emit('backend:request', 'preserve:run:state', {
            currentId: 'test',
            currentRetry: 0,
          }, resolve)
        })

        const mockProtocolManager = {
          resetTest: vi.fn(),
        }

        socket['_protocolManager'] = mockProtocolManager

        await new Promise<void>((resolve) => {
          client.emit('get:cached:test:state', (runState, testState) => {
            expect(runState).toEqual({
              currentId: 'test',
              currentRetry: 0,
            })

            expect(testState).toEqual({
              activeSessions: {},
            })

            expectCalledWith(mockProtocolManager.resetTest, 'test', 0)

            resolve()
          })
        })
      })
    })
  })

  describe('run events (experimentalInteractiveRunEvents)', () => {
    let runEventsStub: MockInstance

    beforeEach(async () => {
      runEventsStub = vi.spyOn(runEvents, 'execute').mockResolvedValue(undefined)

      cfg.experimentalInteractiveRunEvents = true

      await server.open(cfg, {
        SocketCtor: SocketE2E,
        createRoutes,
        testingType: 'e2e',
        getCurrentBrowser: () => null,
      })

      // the client below CONNECTs through this server like a proxied browser,
      // which only happens on the MITM path — and the server refuses CONNECT
      // until a launch resolves that path
      await server.setNetworkMode(false)

      const options = {
        getSavedState: vi.fn(),
        onSavedStateChanged: vi.fn(),
        onStudioInit: vi.fn(),
        onStudioDestroy: vi.fn(),
        onCyPromptReady: vi.fn(),
      }

      const automation = new Automation({
        cyNamespace: cfg.namespace,
        cookieNamespace: cfg.socketIoCookie,
        screenshotsFolder: cfg.screenshotsFolder,
      })

      const mockCyPrompt = {
        addSocketListeners: vi.fn(),
        status: 'INITIALIZED',
        reset: vi.fn(),
      }

      ctx.coreData.studioLifecycleManager = {
        registerStudioReadyListener: vi.fn((callback) => {
          callback({ addSocketListeners: vi.fn() })

          return () => {}
        }),
      }

      ctx.coreData.cyPromptLifecycleManager = {
        getCyPrompt: vi.fn().mockResolvedValue({ cyPromptManager: mockCyPrompt }),
        resetCyPrompt: vi.fn(),
        registerCyPromptReadyListener: vi.fn((callback) => {
          callback(mockCyPrompt)

          return () => {}
        }),
      }

      server.startWebsockets(automation, cfg, options)
      socket = server._socket

      const { proxyUrl, socketIoRoute } = cfg
      const agent = new httpsAgent(`http://localhost:${cfg.port}`)

      await new Promise((resolve) => {
        socket.socketIo.on('connection', () => resolve(null))
        client = socketIo.client(proxyUrl, {
          agent,
          path: socketIoRoute,
          transports: ['websocket'],
        })
      })
    })

    afterEach(() => {
      runEventsStub?.mockRestore()

      return client?.disconnect()
    })

    describe('on(plugins:before:spec)', () => {
      it('executes before:spec on initial spec load', async () => {
        const spec = { relative: 'cypress/e2e/spec.cy.js', absolute: '/project/cypress/e2e/spec.cy.js' }

        await new Promise((resolve) => {
          client.emit('plugins:before:spec', spec, resolve)
        })

        expectCalledWith(runEventsStub, 'before:spec', spec)
      })

      it('skips before:spec when Cypress reloads mid-test due to cross-origin navigation (runState set)', async () => {
        await new Promise((resolve) => {
          client.emit('backend:request', 'preserve:run:state', { currentId: 'test-1' }, resolve)
        })

        await new Promise((resolve) => {
          client.emit('plugins:before:spec', { relative: 'cypress/e2e/spec.cy.js' }, resolve)
        })

        expect(runEventsStub).not.toHaveBeenCalled()
      })

      it('executes before:spec again after runState is consumed', async () => {
        await new Promise((resolve) => {
          client.emit('backend:request', 'preserve:run:state', { currentId: 'test-1' }, resolve)
        })

        await new Promise((resolve) => {
          client.emit('plugins:before:spec', { relative: 'cypress/e2e/spec.cy.js' }, resolve)
        })

        expect(runEventsStub).not.toHaveBeenCalled()

        // Consuming runState simulates what happens when get:cached:test:state is called after reload
        await new Promise((resolve) => {
          client.emit('get:cached:test:state', resolve)
        })

        const spec = { relative: 'cypress/e2e/spec.cy.js', absolute: '/project/cypress/e2e/spec.cy.js' }

        await new Promise((resolve) => {
          client.emit('plugins:before:spec', spec, resolve)
        })

        expect(runEventsStub).toHaveBeenCalledTimes(1)
        expectCalledWith(runEventsStub, 'before:spec', spec)
      })
    })
  })

  describe('unit', () => {
    describe('e2e', () => {
      beforeEach(() => {
        mockClient = {
          on: vi.fn(),
          emit: vi.fn(),
          conn: {
            transport: {
              name: 'websocket',
            },
          },
        }

        // Yields for every event, not only 'connection'.
        io = {
          of: vi.fn(() => ({ on () {} })),
          on: vi.fn((_event, callback) => callback(mockClient)),
          emit: vi.fn(),
          close: vi.fn(),
        }

        vi.spyOn(SocketE2E.prototype, 'createSocketIo').mockReturnValue(io)

        return server.open(cfg, {
          SocketCtor: SocketE2E,
          createRoutes,
          testingType: 'e2e',
          getCurrentBrowser: () => null,
        })
        .then(() => {
          automation = new Automation({
            cyNamespace: cfg.namespace,
            cookieNamespace: cfg.socketIoCookie,
            screenshotsFolder: cfg.screenshotsFolder,
          })

          server.startWebsockets(automation, cfg, {})

          socket = server._socket
        })
      })

      describe('constructor', () => {
        it('listens for \'file:updated\' on preprocessor', () => {
          cfg.watchForFileChanges = true
          new SocketE2E(cfg)

          expectCalledWith(preprocessorOn, 'file:updated')
        })

        it('does not listen for \'file:updated\' if config.watchForFileChanges is false', () => {
          preprocessorOn.mockClear()
          cfg.watchForFileChanges = false
          new SocketE2E(cfg)

          expect(preprocessorOn).not.toHaveBeenCalled()
        })
      })

      describe('#sendFocusBrowserMessage', () => {
        it('sends an automation request of focus:browser:window', () => {
          const request = vi.spyOn(automation, 'request').mockReturnValue(undefined)

          socket.sendFocusBrowserMessage()

          expectCalledWith(request, 'focus:browser:window', {})
        })
      })

      describe('#close', () => {
        it('calls close on #io', () => {
          socket.close()

          expect(socket.socketIo.close).toHaveBeenCalled()
        })

        it('does not error when io isnt defined', () => {
          return socket.close()
        })
      })

      describe('#watchTestFileByPath', () => {
        let getFile: MockInstance

        beforeEach(() => {
          socket.testsDir = Fixtures.project('todos/tests')

          getFile = vi.spyOn(preprocessor, 'getFile').mockResolvedValue(undefined as any)
        })

        it('returns undefined if trying to watch special path __all', () => {
          const result = socket.watchTestFileByPath(cfg, {
            relative: 'integration/__all',
          })

          expect(result).toBeUndefined()
        })

        it('returns undefined if #testFilePath matches arguments', () => {
          socket.testFilePath = path.join('integration', 'test1.js')
          const result = socket.watchTestFileByPath(cfg, {
            relative: path.join('integration', 'test1.js'),
          })

          expect(result).toBeUndefined()
        })

        it('closes existing watched test file', () => {
          const removeFile = vi.spyOn(preprocessor, 'removeFile').mockReturnValue(undefined)

          socket.testFilePath = 'tests/test1.js'

          return socket.watchTestFileByPath(cfg, {
            relative: 'test2.js',
          }).then(() => {
            expectCalledWith(removeFile, expect.stringContaining('test1.js'), expect.objectContaining(cfg))
          })
        })

        it('sets #testFilePath', () => {
          return socket.watchTestFileByPath(cfg, {
            relative: `${path.sep}test1.js`,
          }).then(() => {
            expect(socket.testFilePath).toBe(`test1.js`)
          })
        })

        it('can normalizes leading slash', () => {
          return socket.watchTestFileByPath(cfg, {
            relative: `${path.sep}integration${path.sep}test1.js`,
          }).then(() => {
            expect(socket.testFilePath).toBe(`integration${path.sep}test1.js`)
          })
        })

        it('watches file by path', () => {
          socket.watchTestFileByPath(cfg, {
            relative: `integration${path.sep}test2.js`,
          })

          expectCalledWith(getFile, `integration${path.sep}test2.js`, cfg)
        })

        it('watches file by relative path in spec object', () => {
          // this is what happens now with component / integration specs
          const spec = {
            absolute: `${path.sep}foo${path.sep}bar`,
            relative: `relative${path.sep}to${path.sep}root${path.sep}test2.js`,
          }

          socket.watchTestFileByPath(cfg, spec)

          expectCalledWith(getFile, spec.relative, cfg)
        })

        it('triggers watched:file:changed event when preprocessor \'file:updated\' is received', () => {
          return new Promise<void>((done) => {
            vi.spyOn(fs, 'statAsync').mockResolvedValue(undefined)
            cfg.watchForFileChanges = true
            socket.watchTestFileByPath(cfg, {
              relative: 'integration/test2.js',
            })

            yieldTo(preprocessorOn, 'file:updated', 'integration/test2.js')

            setTimeout(() => {
              expectCalledWith(io.emit, 'watched:file:changed')

              return done()
            }, 200)
          })
        })
      })

      describe('#startListening', () => {
        describe('watch:test:file', () => {
          it('listens for watch:test:file event', () => {
            socket.startListening(server.getHttpServer(), automation, cfg, {})

            expectCalledWith(mockClient.on, 'watch:test:file')
          })

          it('passes filePath to #watchTestFileByPath', () => {
            const watchTestFileByPath = vi.spyOn(socket, 'watchTestFileByPath').mockReturnValue(undefined)

            mockClient.on.mockImplementation((event, ...args) => {
              if (event === 'watch:test:file') {
                args.find((arg) => typeof arg === 'function')({ relative: 'foo/bar/baz' })
              }
            })

            socket.startListening(server.getHttpServer(), automation, cfg, {})

            expectCalledWith(watchTestFileByPath, cfg, { relative: 'foo/bar/baz' })
          })
        })

        describe('#onTestFileChange', () => {
          let statAsync: MockInstance

          beforeEach(() => {
            statAsync = vi.spyOn(fs, 'statAsync')
          })

          it('calls statAsync on .js file', () => {
            return socket.onTestFileChange('foo/bar.js').catch(() => {}).then(() => {
              expectCalledWith(statAsync, 'foo/bar.js')
            })
          })

          it('calls statAsync on .js file', () => {
            return socket.onTestFileChange('foo/bar_style.js').then(() => {
              expectCalledWith(statAsync, 'foo/bar_style.js')
            })
          })

          it('does not emit if stat throws', () => {
            return socket.onTestFileChange('foo/bar.js').then(() => {
              expect(io.emit).not.toHaveBeenCalled()
            })
          })
        })

        describe('#onCloudTestFileChange', () => {
          it('calls #onTestFileChange', () => {
            preprocessorOff.mockClear()
            const onTestFileChange = vi.spyOn(socket, 'onTestFileChange').mockResolvedValue(undefined)

            return socket.onCloudTestFileChange('foo/bar.js').then(() => {
              expectCalledWith(onTestFileChange, 'foo/bar.js')
              expectCalledWith(preprocessorOff, 'file:updated', socket.onCloudTestFileChange)
            })
          })
        })

        describe('#onBeforeSave', () => {
          it('calls #onTestFileChange and listens for file:updated when config.watchForFileChanges is false', () => {
            preprocessorOn.mockClear()

            cfg.watchForFileChanges = false

            socket.onBeforeSave(cfg)

            expectCalledWith(preprocessorOn, 'file:updated', socket.onCloudTestFileChange)
          })

          it('calls #onTestFileChange and does not listen for file:updated when config.watchForFileChanges is true', () => {
            preprocessorOn.mockClear()

            cfg.watchForFileChanges = true

            socket.onBeforeSave(cfg)

            expect(preprocessorOn).not.toHaveBeenCalled()
          })
        })

        describe('#onAfterSave', () => {
          it('removes listener for file:updated when there is an error and config.watchForFileChanges is false', () => {
            preprocessorOff.mockClear()

            cfg.watchForFileChanges = false

            socket.onAfterSave(cfg, new Error('test error'))

            expectCalledWith(preprocessorOff, 'file:updated', socket.onCloudTestFileChange)
          })

          it('does not remove listener for file:updated when there is an error and config.watchForFileChanges is true', () => {
            preprocessorOff.mockClear()

            cfg.watchForFileChanges = true

            socket.onAfterSave(cfg, new Error('test error'))

            expect(preprocessorOff).not.toHaveBeenCalled()
          })

          it('does not remove listener for file:updated when there is no error', () => {
            preprocessorOff.mockClear()

            cfg.watchForFileChanges = false

            socket.onAfterSave(cfg)

            expect(preprocessorOff).not.toHaveBeenCalled()
          })
        })
      })
    })

    describe('ct', () => {
      let devServerOn: MockInstance
      let devServerOff: MockInstance

      beforeEach(() => {
        mockClient = {
          on: vi.fn(),
          emit: vi.fn(),
          conn: {
            transport: {
              name: 'websocket',
            },
          },
        }

        io = {
          of: vi.fn(() => ({ on () {} })),
          on: vi.fn((_event, callback) => callback(mockClient)),
          emit: vi.fn(),
          close: vi.fn(),
        }

        vi.spyOn(SocketE2E.prototype, 'createSocketIo').mockReturnValue(io)
        devServerOn = vi.spyOn(devServer.emitter, 'on').mockReturnValue(undefined as any)
        devServerOff = vi.spyOn(devServer.emitter, 'off').mockReturnValue(undefined as any)

        return server.open(cfg, {
          SocketCtor: SocketCt,
          createRoutes,
          testingType: 'ct',
          getCurrentBrowser: () => null,
        })
        .then(() => {
          automation = new Automation({
            cyNamespace: cfg.namespace,
            cookieNamespace: cfg.socketIoCookie,
            screenshotsFolder: cfg.screenshotsFolder,
          })

          server.startWebsockets(automation, cfg, {})

          socket = server._socket
        })
      })

      describe('#onCloudTestFileChange', () => {
        it('calls #onCloudTestFileChange', () => {
          devServerOff.mockClear()
          const toRunner = vi.spyOn(socket, 'toRunner').mockReturnValue(undefined)

          socket.onCloudTestFileChange({ specFile: 'foo/bar.js' })

          expectCalledWith(toRunner, 'dev-server:compile:success', { specFile: 'foo/bar.js' })
          expectCalledWith(devServerOff, 'dev-server:compile:success', socket.onCloudTestFileChange)
        })
      })

      describe('#onBeforeSave', () => {
        it('calls #onTestFileChange and listens for dev-server:compile:success when config.watchForFileChanges is false', () => {
          devServerOn.mockClear()

          cfg.watchForFileChanges = false

          socket.onBeforeSave(cfg)

          expectCalledWith(devServerOn, 'dev-server:compile:success', socket.onCloudTestFileChange)
        })
      })

      describe('#onAfterSave', () => {
        it('removes listener for dev-server:compile:success when there is an error and config.watchForFileChanges is false', () => {
          devServerOff.mockClear()

          cfg.watchForFileChanges = false

          socket.onAfterSave(cfg, new Error('test error'))

          expectCalledWith(devServerOff, 'dev-server:compile:success', socket.onCloudTestFileChange)
        })

        it('does not remove listener for dev-server:compile:success when there is an error and config.watchForFileChanges is true', () => {
          devServerOff.mockClear()

          cfg.watchForFileChanges = true

          socket.onAfterSave(cfg, new Error('test error'))

          expect(devServerOff).not.toHaveBeenCalled()
        })

        it('does not remove listener for dev-server:compile:success when there is no error', () => {
          devServerOff.mockClear()

          cfg.watchForFileChanges = false

          socket.onAfterSave(cfg)

          expect(devServerOff).not.toHaveBeenCalled()
        })
      })
    })
  })
})
