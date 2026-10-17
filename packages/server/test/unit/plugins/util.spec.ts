import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import * as util from '../../../lib/plugins/util'

describe('lib/plugins/util', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#wrapIpc', () => {
    let theProcess: { send: Mock, on: Mock, connected: boolean, killed?: boolean }
    let ipc

    const yieldOn = (...args: unknown[]) => {
      const callbacks = theProcess.on.mock.calls
      .map((call) => call.find((arg) => typeof arg === 'function'))
      .filter(Boolean)

      if (!callbacks.length) {
        throw new Error('theProcess.on was never called with a function argument')
      }

      callbacks.forEach((callback) => callback(...args))
    }

    beforeEach(() => {
      theProcess = {
        send: vi.fn(),
        on: vi.fn(),
        connected: true,
      }

      ipc = util.wrapIpc(theProcess)
    })

    it('#send sends event through the process', () => {
      ipc.send('event-name', 'arg1', 'arg2')

      expect(theProcess.send).toHaveBeenCalledWith({
        event: 'event-name',
        args: ['arg1', 'arg2'],
      })
    })

    it('#send does not send if process has been killed', () => {
      theProcess.killed = true
      ipc.send('event-name')

      expect(theProcess.send).not.toHaveBeenCalled()
    })

    it('#send does not send if process has been disconnected', () => {
      theProcess.connected = false
      ipc.send('event-name')

      expect(theProcess.send).not.toHaveBeenCalled()
    })

    it('#on listens for process messages that match event', () => {
      const handler = vi.fn()

      ipc.on('event-name', handler)
      yieldOn({
        event: 'event-name',
        args: ['arg1', 'arg2'],
      })

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('#removeListener removes handler', () => {
      const handler = vi.fn()

      ipc.on('event-name', handler)
      ipc.removeListener('event-name', handler)
      yieldOn({
        event: 'event-name',
        args: ['arg1', 'arg2'],
      })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('#wrapChildPromise', () => {
    let ipc: { send: Mock, on: Mock, removeListener: Mock }
    let invoke: Mock
    let ids
    let args

    beforeEach(() => {
      ipc = {
        send: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
      }

      invoke = vi.fn()
      ids = {
        eventId: 0,
        invocationId: '00',
      }

      args = []
    })

    it('calls the invoke function with the callback id and args', () => {
      return util.wrapChildPromise(ipc, invoke, ids).then(() => {
        expect(invoke).toHaveBeenCalledWith(0, args)
      })
    })

    it('wraps the invocation in a promise', () => {
      invoke.mockImplementation(() => {
        const err = new Error()

        err.name = 'some error'
        throw err
      }) // test that invoke is run inside a promise wrapper

      expect(util.wrapChildPromise(ipc, invoke, ids).then).toBeTypeOf('function')
    })

    it('sends "promise:fulfilled:{invocationId}" with value when promise resolves', () => {
      invoke.mockResolvedValue('value')

      return util.wrapChildPromise(ipc, invoke, ids).then(() => {
        expect(ipc.send).toHaveBeenCalledWith('promise:fulfilled:00', null, 'value')
      })
    })

    it('serializes undefined', () => {
      invoke.mockResolvedValue(undefined)

      return util.wrapChildPromise(ipc, invoke, ids).then(() => {
        expect(ipc.send).toHaveBeenCalledWith('promise:fulfilled:00', null, '__cypress_undefined__')
      })
    })

    it('sends "promise:fulfilled:{invocationId}" with error when promise rejects', () => {
      const err = new Error('fail')

      err.code = 'ERM_DUN_FAILED'
      err.annotated = 'annotated error'
      invoke.mockRejectedValue(err)

      return util.wrapChildPromise(ipc, invoke, ids).then(() => {
        expect(ipc.send.mock.calls.filter((call) => call[0] === 'promise:fulfilled:00')).not.toHaveLength(0)
        const actualError = ipc.send.mock.lastCall[1]

        expect(actualError.name).toBe(err.name)
        expect(actualError.message).toBe(err.message)
        expect(actualError.stack).toBe(err.stack)
        expect(actualError.code).toBe(err.code)

        expect(actualError.annotated).toBe(err.annotated)
      })
    })
  })

  describe('#serializeError', () => {
    it('sends error with name, message, stack, code, and annotated properties', () => {
      const err = {
        name: 'the name',
        message: 'the message',
        stack: 'the stack',
        code: 'the code',
        annotated: 'the annotated version',
        extra: 'this is extra',
      }

      expect(util.serializeError(err)).toStrictEqual({
        name: 'the name',
        message: 'the message',
        stack: 'the stack',
        code: 'the code',
        annotated: 'the annotated version',
      })
    })
  })

  describe('#buildErrorLocationFromTransformError', () => {
    it('correctly calculates the compiler error location to correctly display the code frame in the Cypress app', () => {
      const err = {
        name: 'TransformError',
        message: 'Transform failed with 1 error:\n/my/project/root/cypress.config.ts:12:15: ERROR: Unexpected ","',
      }

      const result = util.buildErrorLocationFromTransformError(err, '/my/project/root')

      expect(result).toStrictEqual({
        compilerErrorLocation: {
          filePath: 'cypress.config.ts',
          line: 12,
          column: 15,
        },
        message: 'Error compiling file\n/my/project/root/cypress.config.ts:12:15: ERROR: Unexpected ","',
        originalMessage: 'Transform failed with 1 error:\n/my/project/root/cypress.config.ts:12:15: ERROR: Unexpected ","',
      })
    })
  })

  describe('#buildErrorLocationFromConfigFileError', () => {
    const projectRoot = path.join(__dirname, '../../../../../system-tests/projects/config-with-import-error')
    const configFilePath = path.join(projectRoot, 'cypress.config.js')

    it('parses the config file frame from the stack when present', async () => {
      const err = {
        name: 'Error',
        message: 'Cannot find module \'./webpack.config.js\'',
        stack: `Error: Cannot find module './webpack.config.js'
    at node:internal/modules/cjs/loader:1383:15
    at Object.<anonymous> (${configFilePath}:3:23)`,
      }

      expect(await util.buildErrorLocationFromConfigFileError(err, configFilePath, projectRoot)).toStrictEqual({
        filePath: 'cypress.config.js',
        line: 3,
        column: 23,
      })
    })

    it('falls back to requireStack when node 24 omits the config file from the stack', async () => {
      const err = {
        name: 'Error',
        message: 'Cannot find module \'./webpack.config.js\'',
        requireStack: [configFilePath, `${projectRoot}/[eval]`],
        stack: `Error: Cannot find module './webpack.config.js'
    at node:internal/modules/cjs/loader:1500:15
    at T._resolveFilename (file:///my/project/root/node_modules/tsx/dist/register-CqMfTiWi.mjs:2:14889)`,
      }

      expect(await util.buildErrorLocationFromConfigFileError(err, configFilePath, projectRoot)).toStrictEqual({
        filePath: 'cypress.config.js',
        line: 3,
        column: 23,
      })
    })
  })
})
