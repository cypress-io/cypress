import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import { setRemoteDebuggingPort } from '../../../lib/util/electron-app'
import { app } from 'electron'

describe('/lib/util/electron-app', () => {
  describe('remote debugging port', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should not override port if previously set', async () => {
      getSwitchValue.mockReturnValue('4567')

      await setRemoteDebuggingPort()

      expect(app.commandLine.appendSwitch).not.toHaveBeenCalled()
    })

    it('should assign random port if not previously set', async () => {
      getSwitchValue.mockReturnValue(undefined)

      await setRemoteDebuggingPort()

      expect(app.commandLine.appendSwitch).toHaveBeenCalledWith(
        'remote-debugging-port',
        expect.any(String),
      )
    })
  })
})
