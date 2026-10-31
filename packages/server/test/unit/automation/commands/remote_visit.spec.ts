import { describe, it, expect, vi } from 'vitest'
import vm from 'vm'
import type { Protocol } from 'devtools-protocol'
import type { SendDebuggerCommand } from '../../../../lib/browsers/cdp-protocol/cdp_automation'
import { RemoteVisit, beforeLoadScript, onLoadExpression } from '../../../../lib/automation/commands/remote_visit'
import { cdpUncaughtException, parseUncaughtErrorText } from '../../../../lib/automation/commands/remote_errors'

const createWindow = (name: string) => {
  const win = vm.createContext({ name })

  vm.runInContext('globalThis.window = globalThis', win)

  return win
}

describe('remote visit callbacks', () => {
  const callbacks = {
    token: 'visit-1',
    args: { value: 'from the test' },
    onBeforeLoad: 'Object.values({ onBeforeLoad (win, args) { win.preset = args.value } })[0]',
    onLoad: '(win, args) => { win.loaded = `${win.preset}:${args.value}` }',
  }

  it('runs onBeforeLoad then onLoad in the AUT window with args', () => {
    const win = createWindow('aut')

    vm.runInContext(beforeLoadScript({ ...callbacks, frameName: 'aut' }), win)

    expect(win.preset).toEqual('from the test')
    expect(JSON.parse(vm.runInContext(onLoadExpression(callbacks), win))).toEqual({ beforeLoadRan: true })
    expect(win.loaded).toEqual('from the test:from the test')
  })

  it('skips frames other than the AUT', () => {
    const win = createWindow('spec')

    vm.runInContext(beforeLoadScript({ ...callbacks, frameName: 'aut' }), win)

    expect(win.preset).toBeUndefined()
    expect(JSON.parse(vm.runInContext(onLoadExpression({ ...callbacks, onLoad: undefined }), win))).toEqual({ beforeLoadRan: false })
  })

  it('reports an onBeforeLoad error and does not run onLoad', () => {
    const win = createWindow('aut')

    vm.runInContext(beforeLoadScript({ ...callbacks, frameName: 'aut', onBeforeLoad: '() => { throw new TypeError(\'before boom\') }' }), win)

    const result = JSON.parse(vm.runInContext(onLoadExpression(callbacks), win))

    expect(result).toMatchObject({ beforeLoadRan: true, error: { phase: 'onBeforeLoad', name: 'TypeError', message: 'before boom' } })
    expect(win.loaded).toBeUndefined()
  })

  it('reports an onLoad error', () => {
    const win = createWindow('aut')
    const result = JSON.parse(vm.runInContext(onLoadExpression({ ...callbacks, onLoad: '() => { throw \'load boom\' }' }), win))

    expect(result).toEqual({ beforeLoadRan: false, error: { phase: 'onLoad', message: 'load boom' } })
  })

  it('ignores a result left by another visit', () => {
    const win = createWindow('aut')

    vm.runInContext(beforeLoadScript({ ...callbacks, token: 'visit-0', frameName: 'aut' }), win)

    expect(JSON.parse(vm.runInContext(onLoadExpression({ ...callbacks, onLoad: undefined }), win))).toEqual({ beforeLoadRan: false })
  })

  describe('RemoteVisit', () => {
    const createTransport = () => {
      const remove = vi.fn().mockResolvedValue(undefined)

      return {
        remove,
        addPreloadScript: vi.fn().mockResolvedValue(remove),
        evaluateInAut: vi.fn().mockResolvedValue('{"beforeLoadRan":true}'),
      }
    }

    it('removes the preload script before evaluating onLoad', async () => {
      const transport = createTransport()
      const visit = new RemoteVisit(transport)

      await visit.beforeLoad({ ...callbacks, frameName: 'aut' })

      expect(transport.addPreloadScript).toHaveBeenCalledWith(beforeLoadScript({ ...callbacks, frameName: 'aut' }))

      await expect(visit.onLoad(callbacks)).resolves.toEqual({ beforeLoadRan: true })
      expect(transport.remove).toHaveBeenCalledOnce()
      expect(transport.evaluateInAut).toHaveBeenCalledWith(onLoadExpression(callbacks))
    })

    it('removes a preload script a failed visit left behind', async () => {
      const transport = createTransport()
      const visit = new RemoteVisit(transport)

      await visit.beforeLoad({ ...callbacks, frameName: 'aut' })
      await visit.beforeLoad({ ...callbacks, token: 'visit-2', frameName: 'aut' })

      expect(transport.remove).toHaveBeenCalledOnce()
      expect(transport.addPreloadScript).toHaveBeenCalledTimes(2)
    })
  })
})

describe('remote uncaught exceptions', () => {
  describe('parseUncaughtErrorText', () => {
    it('splits the error name from its message', () => {
      expect(parseUncaughtErrorText('TypeError: x is not a function', 'stack', false)).toEqual({
        handlerType: 'error',
        error: { name: 'TypeError', message: 'x is not a function', stack: 'stack' },
      })
    })

    it('recognizes WebKit\'s unhandled rejection prefix', () => {
      expect(parseUncaughtErrorText('Unhandled Promise Rejection: Error: app rejection', undefined, false)).toEqual({
        handlerType: 'unhandledrejection',
        error: { name: 'Error', message: 'app rejection', stack: undefined },
      })
    })

    it('keeps text that has no error name as the message', () => {
      expect(parseUncaughtErrorText('Script error.', undefined, false)).toEqual({
        handlerType: 'error',
        error: { message: 'Script error.', stack: undefined },
      })
    })
  })

  describe('cdpUncaughtException', () => {
    const details = (overrides: Partial<Protocol.Runtime.ExceptionDetails>): Protocol.Runtime.ExceptionDetails => {
      return { exceptionId: 1, text: 'Uncaught', lineNumber: 0, columnNumber: 0, ...overrides }
    }

    it('reads the error\'s properties in the page and releases it', async () => {
      const send = vi.fn(async (method: string) => {
        if (method === 'Runtime.callFunctionOn') {
          return { result: { type: 'object', value: { name: 'Error', message: 'app boom', stack: 'Error: app boom' } } }
        }

        return {}
      }) as unknown as SendDebuggerCommand

      const result = await cdpUncaughtException(send, details({ exception: { type: 'object', subtype: 'error', objectId: 'err-1' } }))

      expect(result).toEqual({ handlerType: 'error', error: { name: 'Error', message: 'app boom', stack: 'Error: app boom' } })
      expect(send).toHaveBeenCalledWith('Runtime.releaseObject', { objectId: 'err-1' })
    })

    it('reports a thrown primitive and an unhandled rejection', async () => {
      const send = vi.fn() as unknown as SendDebuggerCommand

      await expect(cdpUncaughtException(send, details({ text: 'Uncaught (in promise)', exception: { type: 'string', value: 'nope' } }))).resolves.toEqual({
        handlerType: 'unhandledrejection',
        error: { message: 'nope' },
      })

      expect(send).not.toHaveBeenCalled()
    })
  })
})
