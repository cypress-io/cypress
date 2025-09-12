import { vi, describe, it, beforeEach, expect } from 'vitest'
import os from 'os'
import _xvfb from '@cypress/xvfb'
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

vi.mock(import('@cypress/xvfb'), async () => {
  const XVFB_MOCK = vi.fn()

  XVFB_MOCK.prototype.start = vi.fn()

  return {
    default: XVFB_MOCK,
  }
})

describe('lib/exec/xvfb', function () {
  beforeEach(function (): void {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    // @ts-expect-error - mockReturnValue
    os.platform.mockReturnValue('win32')
  })

  describe('#start', function () {
    it('passes', async () => {
      vi.spyOn(_xvfb.prototype, 'start').mockImplementation((cb) => {
        // mock a pass
        cb()
      })

      await expect(xvfb.start()).resolves.toBeNull()
    })

    it('fails with error message', async () => {
      const message = 'nope'

      vi.spyOn(_xvfb.prototype, 'start').mockImplementation((cb) => {
        // mock a failure
        cb(new Error(message))
      })

      await expect(xvfb.start()).rejects.toThrow(message)
    })

    it('fails when xvfb exited with non zero exit code', async () => {
      const e: any = new Error('something bad happened')

      e.nonZeroExitCode = true

      vi.spyOn(_xvfb.prototype, 'start').mockImplementation((cb) => {
        // mock a failure
        cb(e)
      })

      await expect(xvfb.start()).rejects.toThrow(expect.objectContaining({
        message: expect.stringContaining('something bad happened'),
        known: true,
      }))

      await expect(xvfb.start()).rejects.toThrow(expect.objectContaining({
        message: expect.stringContaining('Xvfb exited with a non zero exit code.'),
        known: true,
      }))
    })
  })

  describe('#isNeeded', function () {
    it('does not need xvfb on osx', function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('darwin')
      expect(xvfb.isNeeded()).toBe(false)
    })

    it('does not need xvfb on linux when DISPLAY is set', function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('linux')
      vi.stubEnv('DISPLAY', ':99')

      expect(xvfb.isNeeded()).toBe(false)
    })

    it('does need xvfb on linux when no DISPLAY is set', function () {
      vi.stubEnv('DISPLAY', undefined)
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('linux')
      expect(xvfb.isNeeded()).toBe(true)
    })
  })
})
