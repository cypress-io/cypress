import { vi, describe, it, beforeEach, expect } from 'vitest'
import os from 'os'
import _xvfb from '@cypress/xvfb'
import xvfb from '../../../lib/exec/xvfb'

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
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
    vi.mocked(os.platform).mockReturnValue('win32')
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

    it('tells a missing Xvfb apart, with install commands', async () => {
      const e: any = new Error('spawn Xvfb ENOENT')

      e.code = 'ENOENT'

      vi.spyOn(_xvfb.prototype, 'start').mockImplementation((cb) => {
        cb(e)
      })

      await expect(xvfb.start()).rejects.toThrow(expect.objectContaining({
        message: expect.stringContaining('apt-get install -y xvfb'),
        known: true,
      }))
    })

    it.each([
      ['did not start in time', Object.assign(new Error('Could not start Xvfb.'), { timedOut: true })],
      ['is already in use', new Error('Display :99 is already in use and there is a lock file /tmp/.X99-lock.')],
      ['cannot be run', Object.assign(new Error('spawn Xvfb EACCES'), { code: 'EACCES' })],
    ])('tells an Xvfb that %s apart from a missing one, keeping the original message', async (_name, e) => {
      vi.spyOn(_xvfb.prototype, 'start').mockImplementation((cb) => {
        cb(e)
      })

      const failure = await xvfb.start().catch((err) => err)

      expect(failure.message).toContain('Xvfb is installed but could not start.')
      expect(failure.message).toContain('XVFB_DISPLAY_NUM')
      expect(failure.message).toContain(`within ${xvfb._xvfbOptions.timeout / 1000} seconds`)
      expect(failure.message).toContain(e.message)
      expect(failure.message).not.toContain('missing the dependency')
      expect(failure.known).toBe(true)
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
      vi.mocked(os.platform).mockReturnValue('darwin')
      expect(xvfb.isNeeded()).toBe(false)
    })

    it('does not need xvfb on linux when DISPLAY is set', function () {
      vi.mocked(os.platform).mockReturnValue('linux')
      vi.stubEnv('DISPLAY', ':99')

      expect(xvfb.isNeeded()).toBe(false)
    })

    it('does not need xvfb when the given env has ELECTRON_RUN_AS_NODE', function () {
      vi.mocked(os.platform).mockReturnValue('linux')
      vi.stubEnv('DISPLAY', undefined)

      expect(xvfb.isNeeded({ ELECTRON_RUN_AS_NODE: '1' })).toBe(false)
    })

    it('reads DISPLAY from the given env instead of process.env', function () {
      vi.mocked(os.platform).mockReturnValue('linux')
      vi.stubEnv('DISPLAY', ':99')

      expect(xvfb.isNeeded({})).toBe(true)
      expect(xvfb.isNeeded({ DISPLAY: ':1' })).toBe(false)
    })

    it('ignores ELECTRON_RUN_AS_NODE in process.env when given a clean env', function () {
      vi.mocked(os.platform).mockReturnValue('linux')
      vi.stubEnv('ELECTRON_RUN_AS_NODE', '1')
      vi.stubEnv('DISPLAY', undefined)

      expect(xvfb.isNeeded({})).toBe(true)
    })

    it('does need xvfb on linux when no DISPLAY is set', function () {
      vi.stubEnv('DISPLAY', undefined)
      vi.mocked(os.platform).mockReturnValue('linux')
      expect(xvfb.isNeeded()).toBe(true)
    })
  })
})
