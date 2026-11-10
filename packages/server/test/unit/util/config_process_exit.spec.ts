import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getError } from '@packages/errors'
import * as errors from '../../../lib/errors'
import { GracefulExit } from '../../../lib/util/graceful-exit'
import {
  endRunOnConfigProcessExit,
  isConfigProcessExit,
  resetConfigProcessExitForTesting,
  wasConfigProcessExitReported,
} from '../../../lib/util/config_process_exit'

describe('lib/util/config_process_exit', () => {
  let consoleLog: ReturnType<typeof vi.spyOn>
  let exitGracefully: ReturnType<typeof vi.spyOn>

  const printed = () => consoleLog.mock.calls.map((args) => String(args[0])).join('\n')

  beforeEach(() => {
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    exitGracefully = vi.spyOn(GracefulExit, 'exitGracefully').mockResolvedValue(undefined)
  })

  afterEach(() => {
    resetConfigProcessExitForTesting()
    vi.restoreAllMocks()
  })

  it('recognizes the error and tolerates null and undefined', () => {
    expect(isConfigProcessExit(getError('CONFIG_PROCESS_EXITED_UNEXPECTEDLY', null, 'SIGKILL'))).toBe(true)
    expect(isConfigProcessExit(new Error('other'))).toBe(false)
    expect(isConfigProcessExit(null)).toBe(false)
    expect(isConfigProcessExit(undefined)).toBe(false)
  })

  describe('endRunOnConfigProcessExit', () => {
    it('prints the error once and exits with code 1', () => {
      const err = getError('CONFIG_PROCESS_EXITED_UNEXPECTEDLY', null, 'SIGKILL')

      endRunOnConfigProcessExit(err)
      endRunOnConfigProcessExit(err)
      endRunOnConfigProcessExit(getError('CONFIG_PROCESS_EXITED_UNEXPECTEDLY', 1, null))

      expect(printed().match(/exited unexpectedly/g)).toHaveLength(1)
      expect(exitGracefully).toHaveBeenCalledExactlyOnceWith(1)
      expect(wasConfigProcessExitReported()).toBe(true)
    })
  })

  it('still exits with code 1 when printing the error throws', () => {
    consoleLog.mockImplementation(() => {
      throw new Error('stdout closed')
    })

    expect(() => endRunOnConfigProcessExit(getError('CONFIG_PROCESS_EXITED_UNEXPECTEDLY', null, 'SIGKILL'))).toThrow('stdout closed')
    expect(exitGracefully).toHaveBeenCalledExactlyOnceWith(1)
  })

  describe('errors.logException', () => {
    it('prints unrelated errors during a teardown that is not caused by the config process', async () => {
      await errors.logException(getError('BROWSER_PROCESS_CLOSED_UNEXPECTEDLY', 'chrome'))

      expect(printed()).toContain('closed unexpectedly')
    })

    it('stays silent for errors that follow a reported config process exit', async () => {
      endRunOnConfigProcessExit(getError('CONFIG_PROCESS_EXITED_UNEXPECTEDLY', null, 'SIGKILL'))
      consoleLog.mockClear()

      await errors.logException(new Error('ERR_FAILED (-2) loading about:blank'))

      expect(consoleLog).not.toHaveBeenCalled()
    })
  })
})
