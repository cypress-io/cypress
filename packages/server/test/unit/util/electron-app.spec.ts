import { describe, it, expect, vi, beforeEach } from 'vitest'

const appendSwitch = vi.hoisted(() => {
  return vi.fn()
})

const getSwitchValue = vi.hoisted(() => {
  return vi.fn()
})

vi.mock('electron', () => {
  return {
    app: {
      commandLine: {
        appendSwitch,
        getSwitchValue,
      },
    },
  }
})

import { setRemoteDebuggingPort } from '../../../lib/util/electron-app'

describe('/lib/util/electron-app', () => {
  describe('remote debugging port', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should not override port if previously set', async () => {
      getSwitchValue.mockImplementation(() => {
        return '4567'
      })

      await setRemoteDebuggingPort()

      expect(appendSwitch).not.toHaveBeenCalled()
    })

    it('should assign random port if not previously set', async () => {
      getSwitchValue.mockImplementation(() => {
        return undefined
      })

      await setRemoteDebuggingPort()

      expect(appendSwitch).toHaveBeenCalledWith('remote-debugging-port', expect.any(String))
    })
  })
})
