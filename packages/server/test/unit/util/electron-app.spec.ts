import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setRemoteDebuggingPort } from '../../../lib/util/electron-app'

const appendSwitch = vi.hoisted(() => vi.fn())
const getSwitchValue = vi.hoisted(() => vi.fn())

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

describe('/lib/util/electron-app', () => {
  describe('remote debugging port', () => {
    beforeEach(() => {
      appendSwitch.mockReset()
      getSwitchValue.mockReset()
    })

    it('should not override port if previously set', async () => {
      getSwitchValue.mockImplementation(() => '4567')

      await setRemoteDebuggingPort()

      expect(appendSwitch).not.toHaveBeenCalled()
    })

    it('should assign random port if not previously set', async () => {
      getSwitchValue.mockImplementation(() => undefined)

      await setRemoteDebuggingPort()

      expect(appendSwitch).toHaveBeenCalledWith('remote-debugging-port', expect.any(String))
    })
  })
})
