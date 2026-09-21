import { beforeEach, describe, it, expect, vi } from 'vitest'

const electronMocks = vi.hoisted(() => {
  return {
    appendSwitch: vi.fn(),
    getSwitchValue: vi.fn(),
  }
})

vi.mock('electron', () => {
  return {
    app: {
      commandLine: {
        appendSwitch: electronMocks.appendSwitch,
        getSwitchValue: electronMocks.getSwitchValue,
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
      electronMocks.getSwitchValue.mockReturnValue('4567')

      await setRemoteDebuggingPort()

      expect(electronMocks.appendSwitch).not.toHaveBeenCalled()
    })

    it('should assign random port if not previously set', async () => {
      electronMocks.getSwitchValue.mockReturnValue(undefined)

      await setRemoteDebuggingPort()

      expect(electronMocks.appendSwitch).toHaveBeenCalledWith(
        'remote-debugging-port',
        expect.any(String),
      )
    })
  })
})
