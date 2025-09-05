import { vi, describe, it, beforeEach, expect } from 'vitest'
import os from 'os'
import path from 'path'
import createDebug from 'debug'
import fs from 'fs-extra'
import { cwd } from 'process'

import logger from '../../../lib/logger'
import util from '../../../lib/util'
import state from '../../../lib/tasks/state'

vi.mock('path', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    cwd: vi.fn(),
    default: {
      // @ts-expect-error
      ...actual.default,
      resolve: vi.fn(),
    },
  }
})

vi.mock('process', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    cwd: vi.fn(),
    default: {
      // @ts-expect-error
      ...actual.default,
      cwd: vi.fn(),
    },
  }
})

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

vi.mock('fs-extra', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      pathExists: vi.fn(),
      readJson: vi.fn(),
      outputJson: vi.fn(),
      realpath: vi.fn(),
    },
  }
})

vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      pkgVersion: vi.fn(),
      getCacheDir: vi.fn(),
    },
  }
})

const debug = createDebug('test')

const cacheDir = path.join('.cache/Cypress')
const versionDir = path.join(cacheDir, '1.2.3')
const binaryDir = path.join(versionDir, 'Cypress.app')
const binaryPkgPath = path.join(
  binaryDir,
  'Contents',
  'Resources',
  'app',
  'package.json',
)

describe('lib/tasks/state', function () {
  beforeEach(async function () {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
    logger.reset()

    // @ts-expect-error - mockReturnValue
    util.getCacheDir.mockReturnValue(cacheDir)
    // @ts-expect-error - mockReturnValue
    util.pkgVersion.mockReturnValue('1.2.3')
    // @ts-expect-error - mockReturnValue
    os.platform.mockReturnValue('darwin')

    const actualProcess = (await vi.importActual<typeof import('process')>('process')).default

    // @ts-expect-error - mockImplementation
    cwd.mockImplementation(() => {
      return actualProcess.cwd()
    })

    const actualPath = (await vi.importActual<typeof import('path')>('path')).default

    // @ts-expect-error - mockImplementation
    path.resolve.mockImplementation((...args) => {
      return actualPath.resolve.apply(actualPath, args)
    })
  })

  describe('.getBinaryPkgVersion', function () {
    it('returns version if present', () => {
      expect(state.getBinaryPkgVersion({ version: '1.2.3' })).toEqual('1.2.3')
    })

    it('returns null if passed null', () => {
      expect(state.getBinaryPkgVersion(null)).toEqual(null)
    })
  })

  describe('.getBinaryPkgAsync', function () {
    it('resolves with loaded file when the file exists', async function () {
      // @ts-expect-error - mockImplementation
      fs.pathExists.mockImplementation((args) => {
        if (args === binaryPkgPath) {
          return true
        }
      })

      // @ts-expect-error - mockImplementation
      fs.readJson.mockImplementation((args) => {
        if (args === binaryPkgPath) {
          return { version: '2.0.48' }
        }
      })

      const result = await state.getBinaryPkgAsync(binaryDir)

      expect(result).toEqual({ version: '2.0.48' })
    })

    it('returns null if no version found', async function () {
      // @ts-expect-error - mockImplementation
      fs.pathExists.mockImplementation((args) => {
        if (args === binaryPkgPath) {
          return false
        }
      })

      const result = await state.getBinaryPkgAsync(binaryDir)

      expect(result).toBeNull()
    })

    it('returns correct version if passed binaryDir', async function () {
      const customBinaryDir = '/custom/binary/dir'
      const customBinaryPackageDir =
        '/custom/binary/dir/Contents/Resources/app/package.json'

      // @ts-expect-error - mockImplementation
      fs.pathExists.mockImplementation((args) => {
        if (args === customBinaryPackageDir) {
          return true
        }
      })

      // @ts-expect-error - mockImplementation
      fs.readJson.mockImplementation((args) => {
        if (args === customBinaryPackageDir) {
          return { version: '3.4.5' }
        }
      })

      const result = await state.getBinaryPkgAsync(customBinaryDir)

      expect(result).toEqual({ version: '3.4.5' })
    })
  })

  describe('.getPathToExecutable', function () {
    it('resolves path on macOS', function () {
      expect(state.getPathToExecutable(state.getBinaryDir())).toEqual(
        '.cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress',
      )
    })

    it('resolves path on linux', function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('linux')
      expect(state.getPathToExecutable(state.getBinaryDir())).toEqual(
        '.cache/Cypress/1.2.3/Cypress/Cypress',
      )
    })

    it('resolves path on windows', function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('win32')
      expect(state.getPathToExecutable(state.getBinaryDir())).toMatch(/\.exe$/)
    })

    it('resolves from custom binaryDir', function () {
      expect(state.getPathToExecutable('home/downloads/cypress.app')).toEqual(
        'home/downloads/cypress.app/Contents/MacOS/Cypress',
      )
    })
  })

  describe('.getBinaryDir', function () {
    it('resolves path on macOS', function () {
      expect(state.getBinaryDir()).toEqual(
        path.join(versionDir, 'Cypress.app'),
      )
    })

    it('resolves path on linux', function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('linux')
      expect(state.getBinaryDir()).toEqual(path.join(versionDir, 'Cypress'))
    })

    it('resolves path on windows', async function () {
      vi.doMock('path', async (importActual) => {
        const actual = await importActual()

        return {
          // @ts-expect-error
          default: actual.default.win32,
        }
      })

      vi.resetModules()
      const stateWithWin32Path = (await import('../../../lib/tasks/state')).default

      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('win32')
      const pathToExec = stateWithWin32Path.getBinaryDir()

      expect(pathToExec).to.be.equal(path.win32.join(versionDir, 'Cypress'))
    })

    it('resolves path to binary/installation directory', function () {
      expect(state.getBinaryDir()).toEqual(binaryDir)
    })

    it('resolves path to binary/installation from version', function () {
      expect(state.getBinaryDir('4.5.6')).toEqual(
        path.join(cacheDir, '4.5.6', 'Cypress.app'),
      )
    })

    it('rejects on anything else', function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('unknown')
      expect(() => {
        return state.getBinaryDir()
      }).toThrow('Platform: "unknown" is not supported.')
    })
  })

  describe('.getBinaryVerifiedAsync', function () {
    it('resolves true if verified', async function () {
      // @ts-expect-error - mockResolvedValue
      fs.readJson.mockResolvedValue({ verified: true })

      const isVerified = await state.getBinaryVerifiedAsync('/asdf')

      expect(isVerified).toEqual(true)
    })

    it('resolves undefined if not verified', async function () {
      const err: any = new Error()

      err.code = 'ENOENT'
      // @ts-expect-error - mockRejectedValue
      fs.readJson.mockRejectedValue(err)

      const isVerified = await state.getBinaryVerifiedAsync('/asdf')

      expect(isVerified).toEqual(undefined)
    })

    it('can accept custom binaryDir', async function () {
      // note how the binary state file is in the runner's parent folder
      const customBinaryDir = '/custom/binary/1.2.3/runner'
      const binaryStatePath = '/custom/binary/1.2.3/binary_state.json'

      // @ts-expect-error - mockImplementation
      fs.pathExists.mockImplementation((args) => {
        if (args === binaryStatePath) {
          return true
        }
      })

      // @ts-expect-error - mockImplementation
      fs.readJson.mockImplementation((args) => {
        if (args === binaryStatePath) {
          return { verified: true }
        }
      })

      const isVerified = await state.getBinaryVerifiedAsync(customBinaryDir)

      expect(isVerified).toEqual(true)
    })
  })

  describe('.writeBinaryVerified', function () {
    const binaryStateFilename = path.join(versionDir, 'binary_state.json')

    it('writes to binary state verified:true', async function () {
      // @ts-expect-error - mockResolvedValue
      fs.outputJson.mockResolvedValue()

      await state.writeBinaryVerifiedAsync(true, binaryDir)

      expect(fs.outputJson).toHaveBeenCalledWith(binaryStateFilename, { verified: true }, { spaces: 2 })
    })

    it('write to binary state verified:false', async function () {
      // @ts-expect-error - mockResolvedValue
      fs.outputJson.mockResolvedValue()

      await state.writeBinaryVerifiedAsync(false, binaryDir)

      expect(fs.outputJson).toHaveBeenCalledWith(
        binaryStateFilename,
        { verified: false },
        { spaces: 2 },
      )
    })
  })

  describe('.getCacheDir', function () {
    beforeEach(async function () {
      vi.unstubAllEnvs()
    })

    it('uses cachedir()', function () {
      const ret = state.getCacheDir()

      expect(ret).toEqual(cacheDir)
    })

    it('uses env variable CYPRESS_CACHE_FOLDER', function () {
      vi.stubEnv('CYPRESS_CACHE_FOLDER', '/path/to/dir')
      const ret = state.getCacheDir()

      expect(ret).toEqual('/path/to/dir')
    })

    it('CYPRESS_CACHE_FOLDER resolves from relative path', () => {
      vi.stubEnv('CYPRESS_CACHE_FOLDER', './local-cache/folder')
      const ret = state.getCacheDir()

      expect(ret).toEqual(path.resolve('local-cache/folder'))
    })

    it('CYPRESS_CACHE_FOLDER resolves from relative path during postinstall', async () => {
      vi.stubEnv('CYPRESS_CACHE_FOLDER', './local-cache/folder')
      // simulates current folder when running "npm postinstall" hook
      // @ts-expect-error - mockReturnValue
      cwd.mockReturnValue('/my/project/folder/node_modules/cypress')

      // @ts-expect-error - default import
      const actualPath = (await vi.importActual<typeof import('path')>('path')).default

      // @ts-expect-error - mockImplementation
      path.resolve.mockImplementation((...args) => {
        return actualPath.resolve('/my/project/folder/node_modules/cypress', args[0])
      })

      const ret = state.getCacheDir()

      debug('returned cache dir %s', ret)
      expect(ret).toEqual(actualPath.resolve('/my/project/folder/local-cache/folder'))
    })

    it('CYPRESS_CACHE_FOLDER resolves from absolute path during postinstall', () => {
      vi.stubEnv('CYPRESS_CACHE_FOLDER', '/cache/folder/Cypress')

      // simulates current folder when running "npm postinstall" hook
      // @ts-expect-error - mockReturnValue
      cwd.mockReturnValue('/my/project/folder/node_modules/cypress')
      const ret = state.getCacheDir()

      debug('returned cache dir %s', ret)
      expect(ret).to.eql(path.resolve('/cache/folder/Cypress'))
    })

    it('resolves ~ with user home folder', () => {
      const homeDir = os.homedir()

      vi.stubEnv('CYPRESS_CACHE_FOLDER', '~/.cache/Cypress')

      const ret = state.getCacheDir()

      debug('cache dir is "%s"', ret)
      expect(path.isAbsolute(ret), ret).toEqual(true)
      expect(ret, '~ has been resolved').not.toContain('~')
      expect(ret, 'replaced ~ with home directory').toEqual(`${homeDir}/.cache/Cypress`)
    })
  })

  describe('.parseRealPlatformBinaryFolderAsync', function () {
    beforeEach(function () {
      // @ts-expect-error - mockImplementation
      fs.realpath.mockImplementation((path) => Promise.resolve(path))
    })

    it('can parse on darwin', async function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('darwin')

      const path = await state.parseRealPlatformBinaryFolderAsync(
        '/Documents/Cypress.app/Contents/MacOS/Cypress',
      )

      expect(path).toEqual('/Documents/Cypress.app')
    })

    it('can parse on linux', async function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('linux')

      const path = await state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress')

      expect(path).toEqual('/Documents/Cypress')
    })

    it('can parse on darwin', async function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('win32')

      const path = await state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress.exe')

      expect(path).toEqual('/Documents/Cypress')
    })

    it('throws when invalid on darwin', async function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('darwin')

      const path = await state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress.exe')

      expect(path).toEqual(false)
    })

    it('throws when invalid on linux', async function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('linux')

      const path = await state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress.exe')

      expect(path).toEqual(false)
    })

    it('throws when invalid on windows', async function () {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('win32')

      const path = await state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress')

      expect(path).toEqual(false)
    })
  })
})
