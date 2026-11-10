import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import * as errors from '../../../lib/errors'
import * as plugins from '../../../lib/plugins'
import runEvents from '../../../lib/plugins/run_events'

describe('lib/plugins/run_events', () => {
  describe('#execute', () => {
    let executeSpy: Mock
    let hasSpy: Mock
    let throwErrSpy: Mock

    beforeEach(() => {
      executeSpy = vi.spyOn(plugins, 'execute').mockResolvedValue(undefined)
      hasSpy = vi.spyOn(plugins, 'has').mockReturnValue(false)
      throwErrSpy = vi.spyOn(errors, 'throwErr')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('returns a promise noop if event is not registered', async () => {
      await runEvents.execute('before:spec')

      expect(executeSpy).not.toHaveBeenCalled()
    })

    it('runs plugins.execute', async () => {
      hasSpy.mockReturnValue(true)
      executeSpy.mockResolvedValue('the result')

      await runEvents.execute('before:spec', 'arg1', 'arg2')

      expect(executeSpy).toHaveBeenCalledWith('before:spec', 'arg1', 'arg2')
    })

    it('returns a promise with result of plugins.execute', async () => {
      hasSpy.mockReturnValue(true)
      executeSpy.mockResolvedValue('the result')

      const result = await runEvents.execute('before:spec', 'arg1', 'arg2')

      expect(result).toBe('the result')
    })

    it('throws custom error if plugins.execute errors', async () => {
      hasSpy.mockReturnValue(true)
      executeSpy.mockRejectedValue({ name: 'Error', message: 'The event threw an error', stack: 'stack trace' })
      throwErrSpy.mockImplementation(() => undefined)

      await runEvents.execute('before:spec', 'arg1', 'arg2')

      expect(throwErrSpy).toHaveBeenCalledWith('PLUGINS_RUN_EVENT_ERROR', 'before:spec', { name: 'Error', message: 'The event threw an error', stack: 'stack trace' })
    })
  })
})
