import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import type { PluginChildIpc } from '../../../../lib/plugins/child/types'

import { run as runRequireAsyncChild } from '../../../../lib/plugins/child/run_require_async_child'

describe('lib/plugins/child/run_require_async_child', () => {
  let ipc: { send: ReturnType<typeof vi.fn>, on: ReturnType<typeof vi.fn>, removeListener: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    ipc = {
      send: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('errors', () => {
    let processOn: MockInstance
    let err: { name: string, message: string }

    const yieldTo = (event: string, arg: unknown) => {
      const handlers = processOn.mock.calls.filter(([name]) => name === event)

      expect(handlers.length).toBeGreaterThan(0)

      handlers.forEach(([, handler]) => handler(arg))
    }

    beforeEach(() => {
      processOn = vi.spyOn(process, 'on').mockImplementation(() => process)

      err = {
        name: 'error name',
        message: 'error message',
      }

      return runRequireAsyncChild(ipc as unknown as PluginChildIpc, 'cypress.config.js', 'proj-root', false)
    })

    it('sends the serialized error via ipc on process uncaughtException', () => {
      yieldTo('uncaughtException', err)

      expect(ipc.send).toHaveBeenCalledWith('childProcess:unhandledError', err)
    })

    it('sends the serialized error via ipc on process unhandledRejection', () => {
      yieldTo('unhandledRejection', err)

      expect(ipc.send).toHaveBeenCalledWith('childProcess:unhandledError', err)
    })

    it('unwraps object rejection reason from event.reason on process unhandledRejection', () => {
      yieldTo('unhandledRejection', { reason: err })

      expect(ipc.send).toHaveBeenCalledWith('childProcess:unhandledError', err)
    })

    it('sends the serialized OpenSSL error via ipc on process unhandledRejection', () => {
      yieldTo('unhandledRejection', { ...err, reason: 'reason' })

      expect(ipc.send).toHaveBeenCalledWith('childProcess:unhandledError', err)
    })

    // A watch-mode preprocessor that leaves `Promise.reject(formattedMessages)` unhandled
    it('sends an error with the rejected strings as its message via ipc on process unhandledRejection', () => {
      const messages = ['✘ [ERROR] Unexpected "}"\n\n    helper.js:3:0:\n      3 │ }\n        ╵ ^\n\n']

      yieldTo('unhandledRejection', messages)

      expect(ipc.send).toHaveBeenCalledWith('childProcess:unhandledError', {
        name: 'Error',
        message: messages[0],
        stack: `Error: ${messages[0]}`,
      })
    })

    it('sends an error with the thrown string as its message via ipc on process uncaughtException', () => {
      yieldTo('uncaughtException', 'Session expired for jane.doe@example.com')

      expect(ipc.send).toHaveBeenCalledWith('childProcess:unhandledError', {
        name: 'Error',
        message: 'Session expired for jane.doe@example.com',
        stack: 'Error: Session expired for jane.doe@example.com',
      })
    })
  })
})
