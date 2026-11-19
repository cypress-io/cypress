import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest'
import os from 'os'
import path from 'path'
import type { Systeminformation } from 'systeminformation'
import si from 'systeminformation'
import util from '../../lib/util'
import { errors, getError, formErrorText, parseMissingLibraries } from '../../lib/errors'

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
      ...actual.default,
      platform: vi.fn(),
      arch: vi.fn(),
      release: vi.fn(),
    },
  }
})

// `getRealArch()` falls through to the `arch` package, which reports the real
// machine, so pin it alongside the mocked `os.arch()`
vi.mock('arch', () => ({ default: () => 'x64' }))

vi.mock('systeminformation', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
      ...actual.default,
      osInfo: vi.fn(),
    },
  }
})

vi.mock('../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
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
      const errObject = errors.versionMismatch

      expect(errObject).toMatchSnapshot()

      const e = await getError(errObject)

      expect(e).toBeInstanceOf(Error)
      expect(e).toHaveProperty('known', true)
      expect(e.message).toMatchSnapshot()
    })
  })

  describe('.parseMissingLibraries', () => {
    it('finds each library the dynamic linker could not load, once', () => {
      const output = [
        '/root/.cache/Cypress/Cypress: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory',
        '/root/.cache/Cypress/Cypress: error while loading shared libraries: libgbm.so.1: cannot open shared object file: No such file or directory',
        '/root/.cache/Cypress/Cypress: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory',
      ].join('\n')

      expect(parseMissingLibraries(output)).toEqual(['libnss3.so', 'libgbm.so.1'])
    })

    it('finds none in other output', () => {
      expect(parseMissingLibraries('Missing X server or $DISPLAY')).toEqual([])
      expect(parseMissingLibraries()).toEqual([])
    })
  })

  describe('.errors.missingDependency', () => {
    const textFor = (stderr: string) => formErrorText(errors.missingDependency, stderr)

    it('names a known library and the package that provides it', async () => {
      const text = await textFor('error while loading shared libraries: libgtk-3.so.0: cannot open shared object file')

      expect(text).toContain('libgtk-3.so.0')
      expect(text).toContain('apt-get install -y libgtk-3-0')
    })

    it.each([
      ['libXtst.so.6', 'libxtst6'],
      ['libatk-bridge-2.0.so.0', 'libatk-bridge2.0-0'],
      ['libcups.so.2', 'libcups2'],
      ['libnspr4.so', 'libnspr4'],
    ])('knows the package for %s', async (library, apt) => {
      const text = await textFor(`error while loading shared libraries: ${library}: cannot open shared object file`)

      expect(text).toContain(`apt-get install -y ${apt}`)
    })

    it('prints an install line a shell can run for libasound', async () => {
      const text = await textFor('error while loading shared libraries: libasound.so.2: cannot open shared object file')
      const line = text.split('\n').find((l) => l.includes('apt-get install'))

      expect(line).toContain('libasound2t64')
      expect(line).not.toMatch(/[()]/)
    })

    it('points to apt-file for a library it has no package for', async () => {
      const text = await textFor('error while loading shared libraries: libweird.so.9: cannot open shared object file')

      expect(text).toContain('apt-file search libweird.so.9')
      expect(text).not.toContain('apt-get install')
    })

    it('keeps the original output and the platform details', async () => {
      const text = await textFor('error while loading shared libraries: libnss3.so: cannot open shared object file')

      expect(text).toContain('cannot open shared object file')
      expect(text).toContain('Platform:')
    })

    it('leaves out the error section when there was no output to show', async () => {
      const text = await formErrorText(errors.missingDependency)

      expect(text).toContain('This may be due to a missing library or dependency.')
      expect(text).not.toContain('Please refer to the error below')
    })

    it('gives the general advice when the output names no library', async () => {
      const text = await textFor('an error about dependencies')

      expect(text).toContain('This may be due to a missing library or dependency.')
      expect(text).toContain('an error about dependencies')
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

      // @ts-expect-error - the invalid solution type is what this asserts on
      await expect(formErrorText(error)).rejects.toThrow()
    })

    it('forms full text for invalid display error', async () => {
      const text: string = await formErrorText(errors.invalidSmokeTestDisplayError, 'current message', 'prev message')

      expect(text).toMatchSnapshot()
    })
  })

  describe('.errors.notInstalledCI', function () {
    const originalCacheFolder = process.env.CYPRESS_CACHE_FOLDER

    afterEach(() => {
      if (originalCacheFolder === undefined) {
        delete process.env.CYPRESS_CACHE_FOLDER
      } else {
        process.env.CYPRESS_CACHE_FOLDER = originalCacheFolder
      }
    })

    it('names the overridden cache folder in the paths to persist', async () => {
      const cacheFolder = path.resolve('/tmp', 'custom-cypress-cache')

      process.env.CYPRESS_CACHE_FOLDER = cacheFolder

      const executable = path.join(cacheFolder, '1.2.3', 'Cypress', 'Cypress')
      const text: string = await formErrorText(errors.notInstalledCI(executable))

      expect(text).toContain(`are not caching this path: ${cacheFolder}`)
      expect(text).toContain(`did not persist: ${cacheFolder}`)
      expect(text).not.toContain(util.getCacheDir())
    })
  })
})
