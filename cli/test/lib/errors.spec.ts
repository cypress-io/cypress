import { vi, describe, beforeEach, it, expect } from 'vitest'
import os from 'os'
import si, { Systeminformation } from 'systeminformation'
import util from '../../lib/util'
import { errors, getError, formErrorText } from '../../lib/errors'

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      platform: vi.fn(),
      arch: vi.fn(),
      release: vi.fn(),
    },
  }
})

vi.mock('systeminformation', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      osInfo: vi.fn(),
    },
  }
})

vi.mock('../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      pkgVersion: vi.fn(),
    },
  }
})

describe('errors', function () {
  beforeEach(() => {
    vi.mocked(os.platform).mockReturnValue('test platform' as NodeJS.Platform)
    vi.mocked(os.arch).mockReturnValue('x64')
    vi.mocked(os.release).mockReturnValue('release')
    vi.mocked(si.osInfo).mockResolvedValue({
      distro: 'Foo',
      release: 'OsVersion',
    } as Systeminformation.OsData)

    vi.mocked(util.pkgVersion).mockReturnValue('1.2.3')
  })

  describe('individual', () => {
    it('has the following errors', () => {
      return expect(Object.keys(errors).sort()).toMatchSnapshot()
    })
  })

  describe('getError', () => {
    it('forms full message and creates Error object', async () => {
      const errObject = errors.childProcessKilled('exit', 'SIGKILL')

      expect(errObject).toMatchSnapshot()

      const e = await getError(errObject)

      expect(e).toBeInstanceOf(Error)
      expect(e).toHaveProperty('known', true)
      expect(e.message).toMatchSnapshot()
    })
  })

  describe('.errors.formErrorText', function () {
    it('returns fully formed text message', async () => {
      const { missingXvfb } = errors

      expect(missingXvfb).toBeInstanceOf(Object)

      const text: string = await formErrorText(missingXvfb)

      expect(typeof text).toBe('string')
      expect(text).toMatchSnapshot()
    })

    it('calls solution if a function', async () => {
      const solution = vi.fn().mockReturnValue('a solution')
      const error = {
        description: 'description',
        solution,
      }

      const text: string = await formErrorText(error)

      expect(text).toMatchSnapshot()
      expect(solution).toHaveBeenCalledOnce()
    })

    it('passes message and previous message', async () => {
      const solution = vi.fn().mockReturnValue('a solution')
      const error = {
        description: 'description',
        solution,
      }

      await formErrorText(error, 'msg', 'prevMsg')

      expect(solution).toHaveBeenCalledWith('msg', 'prevMsg')
    })

    it('expects solution to be a string', async () => {
      const error = {
        description: 'description',
        solution: 42,
      }

      await expect(formErrorText(error)).rejects.toThrow()
    })

    it('forms full text for invalid display error', async () => {
      const text: string = await formErrorText(errors.invalidSmokeTestDisplayError, 'current message', 'prev message')

      expect(text).toMatchSnapshot()
    })
  })
})
