import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import os from 'os'
import xvfb from '../../../lib/exec/xvfb'

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      platform: vi.fn(),
    },
  }
})

describe('lib/exec/xvfb-integration', function () {
  beforeEach(function (): void {
    // @ts-expect-error - mockReturnValue
    os.platform.mockReturnValue('win32')
  })

  describe('debugXvfb integration', function () {
    const { Debug } = xvfb._debugXvfb
    const { namespaces } = Debug

    beforeEach(() => {
      Debug.enable(namespaces)
    })

    afterEach(() => {
      Debug.enable(namespaces)
    })

    it('outputs when enabled', function () {
      const processStderrWriteSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(undefined)

      Debug.enable(xvfb._debugXvfb.namespace)

      xvfb._xvfb._onStderrData('asdf')

      expect(processStderrWriteSpy).toHaveBeenCalledWith(expect.stringContaining('cypress:xvfb'))
      expect(processStderrWriteSpy).toHaveBeenCalledWith(expect.stringContaining('asdf'))
    })

    it('does not output when disabled', function () {
      const processStderrWriteSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(undefined)

      Debug.disable()

      xvfb._xvfb._onStderrData('asdf')

      expect(processStderrWriteSpy).not.toHaveBeenCalledWith(expect.stringContaining('cypress:xvfb'))
      expect(processStderrWriteSpy).not.toHaveBeenCalledWith(expect.stringContaining('asdf'))
    })
  })

  describe('xvfbOptions', function () {
    it('sets explicit screen', () => {
      expect(xvfb._xvfbOptions).toHaveProperty('xvfb_args', expect.arrayContaining(['-screen']))
    })
  })
})
