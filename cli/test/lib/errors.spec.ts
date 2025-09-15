import { vi, describe, beforeEach, it, expect } from 'vitest'
import os from 'os'
import si from 'systeminformation'
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
    // @ts-expect-error mockReturnValue
    os.platform.mockReturnValue('test platform')
    // @ts-expect-error mockReturnValue
    os.arch.mockReturnValue('x64')
    // @ts-expect-error mockReturnValue
    os.release.mockReturnValue('release')
    // @ts-expect-error mockResolvedValue
    si.osInfo.mockResolvedValue({
      distro: 'Foo',
      release: 'OsVersion',
    })

    // @ts-expect-error mockReturnValue
    util.pkgVersion.mockReturnValue('1.2.3')
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

      expect(e).to.be.an('Error')
      expect(e).to.have.property('known', true)
      expect(e.message).toMatchSnapshot()
    })
  })

  describe('.errors.formErrorText', function () {
    it('returns fully formed text message', async () => {
      const { missingXvfb } = errors

      expect(missingXvfb).to.be.an('object')

      const text: string = await formErrorText(missingXvfb)

      expect(text).to.be.a('string')
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
