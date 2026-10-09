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
  })
})
