import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import os from 'os'
import path from 'path'
import chalk from 'chalk'
import timers from 'timers/promises'
import fs from 'fs-extra'
import si, { Systeminformation } from 'systeminformation'
import logger from '../../../lib/logger'
import util from '../../../lib/util'
import download from '../../../lib/tasks/download'
import unzip from '../../../lib/tasks/unzip'
import install from '../../../lib/tasks/install'
import state from '../../../lib/tasks/state'
import { Console } from 'console'

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

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      platform: vi.fn(),
      arch: vi.fn(),
    },
  }
})

vi.mock('timers/promises', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      setTimeout: vi.fn(),
    },
  }
})

vi.mock('fs-extra', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      remove: vi.fn(),
      ensureDir: vi.fn(),
      pathExists: vi.fn(),
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
      pkgBuildInfo: vi.fn(),
      isCi: vi.fn(),
      isPostInstall: vi.fn(),
      getPlatformInfo: vi.fn(),
      isInstalledGlobally: vi.fn(),
    },
  }
})

vi.mock('../../../lib/tasks/download', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      start: vi.fn(),
    },
  }
})

vi.mock('../../../lib/tasks/unzip', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      start: vi.fn(),
    },
  }
})

vi.mock('../../../lib/tasks/state', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      getVersionDir: vi.fn(),
      getBinaryDir: vi.fn(),
      getBinaryPkgAsync: vi.fn(),
      getCacheDir: vi.fn(),
    },
  }
})

const packageVersion = '1.2.3'
const downloadDestination = path.join(os.tmpdir(), `cypress-${process.pid}.zip`)
const installDir = '/cache/Cypress/1.2.3'

/**
 * NOTE: icons from listr2 do not render if process.stdout.isTTY is false,
 * which does not exist when running in a worker thread, which is commonly the case in Vitest.
 *
 * This means that the test environment implicitly uses the VerboseRenderer as a fallback,
 * where as the CLI uses the DefaultRenderer.
 *
 * This is the main reason the snapshots look different in testing mode vs when running the commands directly
 * via the CLI. This also allows us for our snapshot tests to be deterministic because we aren't rerendering icon states.
 *
 * @see https://listr2.kilic.dev/renderer/renderer.html#frontmatter-title
 */
describe('/lib/tasks/install', function () {
  const buildInfo = {
    commitSha: 'abc123',
    commitBranch: 'aBranchName',
  }
  const createStdoutCapture = () => {
    const logs: string[] = []

    const originalOut = process.stdout.write

    vi.spyOn(process.stdout, 'write').mockImplementation((strOrBugger: string | Uint8Array) => {
      logs.push(strOrBugger as string)

      return originalOut(strOrBugger)
    })

    return () => logs.join('')
  }

  // Direct console to process.stdout/stderr
  let originalConsole: Console

  let previousChalkLevel: 0 | 1 | 2 | 3

  beforeEach(() => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('npm_config_loglevel', 'notice')

    previousChalkLevel = chalk.level
    chalk.level = 3

    originalConsole = globalThis.console
    // Redirect console output to a custom stream or mock
    globalThis.console = new Console(process.stdout, process.stderr)
  })

  afterEach(() => {
    globalThis.console = originalConsole // Restore original console
    chalk.level = previousChalkLevel
  })

  describe('.start', function () {
    beforeEach(async () => {
      logger.reset()
      vi.mocked(util.isCi).mockReturnValue(false)
      vi.mocked(util.isPostInstall).mockReturnValue(false)
      vi.mocked(util.pkgVersion).mockReturnValue(packageVersion)
      vi.mocked(download.start).mockResolvedValue(packageVersion)
      vi.mocked(unzip.start).mockResolvedValue(undefined)
      vi.mocked(state.getVersionDir).mockReturnValue('/cache/Cypress/1.2.3')
      vi.mocked(state.getBinaryDir).mockReturnValue('/cache/Cypress/1.2.3/Cypress.app')
      vi.mocked(state.getBinaryPkgAsync).mockResolvedValue(undefined)
      vi.mocked(fs.remove).mockResolvedValue(undefined)
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined)
      vi.mocked(os.platform).mockReturnValue('darwin')
      vi.mocked(os.arch).mockReturnValue('x64')
      vi.mocked(si.osInfo).mockResolvedValue({
        distro: 'Foo',
        release: 'OsVersion',
      } as Systeminformation.OsData)

      vi.mocked(timers.setTimeout).mockResolvedValue(undefined)

      const actualUtil = (await vi.importActual<typeof import('../../../lib/util')>('../../../lib/util')).default

      vi.mocked(util.getPlatformInfo).mockImplementation(actualUtil.getPlatformInfo)
    })

    describe('skips install', function () {
      it('when environment variable is set', async () => {
        const output = createStdoutCapture()

        vi.stubEnv('CYPRESS_INSTALL_BINARY', '0')

        await install.start()

        expect(download.start).not.toHaveBeenCalled()

        expect(output()).toMatchSnapshot('skip installation 1')
      })
    })

    describe('non-stable builds', () => {
      const buildInfo = {
        stable: false,
        commitSha: '3b7f0b5c59def1e9b5f385bd585c9b2836706c29',
        commitBranch: 'aBranchName',
        commitDate: new Date('1996-11-27').toISOString(),
      }

      beforeEach(() => {
        vi.mocked(util.pkgBuildInfo).mockReturnValue(buildInfo)
      })

      it('install from a constructed CDN URL', async function () {
        await install.start({ buildInfo })

        expect(download.start).toHaveBeenCalledWith(expect.objectContaining({
          version: 'https://cdn.cypress.io/beta/binary/0.0.0-development/darwin-x64/aBranchName-3b7f0b5c59def1e9b5f385bd585c9b2836706c29/cypress.zip',
        }))
      })

      it('logs a warning about installing a pre-release', async function () {
        const output = createStdoutCapture()

        await install.start({ buildInfo })
        expect(output()).toMatchSnapshot('pre-release warning')
      })

      it('installs to the expected pre-release cache dir', async function () {
        const actualState = (await vi.importActual<typeof import('../../../lib/tasks/state')>('../../../lib/tasks/state')).default

        vi.mocked(state.getVersionDir).mockImplementation(actualState.getVersionDir)

        await install.start({ buildInfo })
        expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
          installDir: expect.stringMatching(/\/Cypress\/beta\-1\.2\.3\-aBranchName\-3b7f0b5c$/),
        }))
      })
    })

    describe('override version', function () {
      it('warns when specifying cypress version in env', async function () {
        const output = createStdoutCapture()

        const version = '0.12.1'

        vi.stubEnv('CYPRESS_INSTALL_BINARY', version)

        await install.start()
        expect(download.start).toHaveBeenCalledWith(expect.objectContaining({
          version,
        }))

        expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
          zipFilePath: downloadDestination,
        }))

        expect(output()).toMatchSnapshot('specify version in env vars 1')
      })

      it('trims environment variable before installing', async function () {
        // note how the version has extra spaces around it on purpose
        const filename = '/tmp/local/file.zip'
        const version = ` ${filename}   `

        vi.stubEnv('CYPRESS_INSTALL_BINARY', version)

        // internally, the variable should be trimmed and just filename checked
        vi.mocked(fs.pathExists).mockImplementation((args) => {
          if (args === filename) {
            return true
          }
        })

        const installDir = state.getVersionDir()

        await install.start()

        expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
          zipFilePath: filename,
          installDir,
        }))
      })

      it('removes double quotes around the environment variable before installing', async function () {
        // note how the version has extra spaces around it on purpose
        // and there are double quotes
        const filename = '/tmp/local/file.zip'
        const version = ` "${filename}"   `

        vi.stubEnv('CYPRESS_INSTALL_BINARY', version)
        // internally, the variable should be trimmed, double quotes removed
        //  and just filename checked against the file system
        vi.mocked(fs.pathExists).mockImplementation((args) => {
          if (args === filename) {
            return true
          }
        })

        const installDir = state.getVersionDir()

        await install.start()

        expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
          zipFilePath: filename,
          installDir,
        }))
      })

      it('can install local binary zip file without download from absolute path', async function () {
        const version = '/tmp/local/file.zip'

        vi.stubEnv('CYPRESS_INSTALL_BINARY', version)

        vi.mocked(fs.pathExists).mockImplementation((args) => {
          if (args === version) {
            return true
          }
        })

        const installDir = state.getVersionDir()

        await install.start()

        expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
          zipFilePath: version,
          installDir,
        }))
      })

      it('can install local binary zip file from relative path', async function () {
        const version = './cypress-resources/file.zip'

        vi.mocked(fs.pathExists).mockImplementation((args) => {
          if (args === version) {
            return true
          }
        })

        vi.stubEnv('CYPRESS_INSTALL_BINARY', version)

        const installDir = state.getVersionDir()

        await install.start()

        expect(download.start).not.toHaveBeenCalled()
        expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
          zipFilePath: path.resolve(version),
          installDir,
        }))
      })

      describe('when version is already installed', function () {
        beforeEach(function () {
          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue({ version: packageVersion })
        })

        it('doesn\'t attempt to download', async function () {
          await install.start()

          expect(download.start).not.toHaveBeenCalled()
          expect(state.getBinaryPkgAsync).toHaveBeenCalledWith('/cache/Cypress/1.2.3/Cypress.app')
        })

        it('logs \'skipping install\' when explicit cypress install', async function () {
          const output = createStdoutCapture()

          await install.start()

          expect(output()).toMatchSnapshot('version already installed - cypress install 1')
        })

        it('logs when already installed when run from postInstall', async function () {
          const output = createStdoutCapture()

          vi.mocked(util.isPostInstall).mockReturnValue(true)

          await install.start()

          expect(output()).toMatchSnapshot('version already installed - postInstall 1')
        })
      })

      describe('when getting installed version fails', function () {
        it('logs message and starts download', async function () {
          const output = createStdoutCapture()

          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue(null)

          await install.start()

          expect(download.start).toHaveBeenCalledWith(expect.objectContaining({
            version: packageVersion,
          }))

          expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
            installDir,
          }))

          expect(output()).toMatchSnapshot('continues installing on failure 1')
        })
      })

      describe('when there is no install version', function () {
        it('logs message and starts download', async function () {
          const output = createStdoutCapture()

          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue(null)

          await install.start()

          expect(download.start).toHaveBeenCalledWith(expect.objectContaining({
            version: packageVersion,
          }))

          expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
            installDir,
          }))

          // cleans up the zip file
          expect(fs.remove).toHaveBeenCalledWith(
            downloadDestination,
          )

          expect(output()).toMatchSnapshot('installs without existing installation 1')
        })
      })

      describe('when getting installed version does not match needed version', function () {
        it('logs message and starts download', async function () {
          const output = createStdoutCapture()

          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue({ version: 'x.x.x' })

          await install.start()
          expect(download.start).toHaveBeenCalledWith(expect.objectContaining({
            version: packageVersion,
          }))

          expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
            installDir,
          }))

          expect(output()).toMatchSnapshot('installed version does not match needed version 1')
        })
      })

      describe('with force: true', function () {
        it('logs message and starts download', async function () {
          const output = createStdoutCapture()

          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue({ version: packageVersion })

          await install.start({ force: true })
          expect(download.start).toHaveBeenCalledWith(expect.objectContaining({
            version: packageVersion,
          }))

          expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
            installDir,
          }))

          expect(output()).toMatchSnapshot('forcing true always installs 1')
        })
      })

      describe('as a global install', function () {
        it('logs global warning and download', async function () {
          const output = createStdoutCapture()

          vi.mocked(util.isInstalledGlobally).mockReturnValue(true)

          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue({ version: 'x.x.x' })

          await install.start()

          expect(download.start).toHaveBeenCalledWith(expect.objectContaining({
            version: packageVersion,
          }))

          expect(unzip.start).toHaveBeenCalledWith(expect.objectContaining({
            installDir,
          }))

          expect(output()).toMatchSnapshot('warning installing as global 1')
        })
      })

      describe('when running in CI', function () {
        it('uses verbose renderer', async function () {
          const output = createStdoutCapture()

          vi.mocked(util.isCi).mockReturnValue(true)

          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue({ version: 'x.x.x' })

          await install.start()

          expect(output()).toMatchSnapshot('installing in ci 1')
        })
      })

      describe('failed write access to cache directory', function () {
        it('logs error on failure', async function () {
          const output = createStdoutCapture()

          vi.mocked(os.platform).mockReturnValue('darwin')
          vi.mocked(state.getCacheDir).mockReturnValue('/invalid/cache/dir')

          const err: any = new Error('EACCES: permission denied, mkdir \'/invalid\'')

          err.code = 'EACCES'

          vi.mocked(fs.ensureDir).mockRejectedValue(err)

          try {
            await install.start()
            throw new Error('should have caught error')
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)

            expect(message).not.toEqual('should have caught error')
            logger.error(err)

            expect(output()).toMatchSnapshot('invalid cache directory 1')
          }
        })
      })

      describe('CYPRESS_INSTALL_BINARY is URL or Zip', function () {
        it('uses cache when correct version installed given URL', async function () {
          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue({ version: '1.2.3' })

          vi.mocked(util.pkgVersion).mockReturnValue('1.2.3')

          vi.stubEnv('CYPRESS_INSTALL_BINARY', 'www.cypress.io/cannot-download/2.4.5')

          await install.start()

          expect(download.start).not.toHaveBeenCalled()
        })

        it('uses cache when mismatch version given URL', async function () {
          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue({ version: '1.2.3' })

          vi.mocked(util.pkgVersion).mockReturnValue('4.0.0')

          vi.stubEnv('CYPRESS_INSTALL_BINARY', 'www.cypress.io/cannot-download/2.4.5')

          await install.start()

          expect(download.start).not.toHaveBeenCalled()
        })

        it('uses cache when correct version installed given Zip', async function () {
          vi.mocked(fs.pathExists).mockImplementation((args) => {
            if (args === '/path/to/zip.zip') {
              return true
            }
          })

          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue({ version: '1.2.3' })

          vi.mocked(util.pkgVersion).mockReturnValue('1.2.3')

          vi.stubEnv('CYPRESS_INSTALL_BINARY', '/path/to/zip.zip')

          await install.start()

          expect(unzip.start).not.toHaveBeenCalled()
        })

        it('uses cache when mismatch version given Zip ', async function () {
          vi.mocked(fs.pathExists).mockImplementation((args) => {
            if (args === '/path/to/zip.zip') {
              return true
            }
          })

          vi.mocked(state.getBinaryPkgAsync).mockResolvedValue({ version: '1.2.3' })

          vi.mocked(util.pkgVersion).mockReturnValue('4.0.0')

          vi.stubEnv('CYPRESS_INSTALL_BINARY', '/path/to/zip.zip')

          await install.start()

          expect(unzip.start).not.toHaveBeenCalled()
        })
      })
    })

    it('is silent when log level is silent', async function () {
      const output = createStdoutCapture()

      vi.stubEnv('npm_config_loglevel', 'silent')

      await install.start()

      expect(output()).toMatchSnapshot('silent install 1')
    })

    it('exits with error when installing on unsupported os', async function () {
      const output = createStdoutCapture()

      vi.mocked(util.getPlatformInfo).mockResolvedValue('Platform: win32-ia32')

      try {
        await install.start()
        throw new Error('should have caught error')
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)

        expect(message).not.toEqual('should have caught error')
        logger.error(err)

        expect(output()).toMatchSnapshot('error when installing on unsupported os')
      }
    })
  })

  describe('._getBinaryUrlFromBuildInfo', function () {
    const buildInfo = {
      commitSha: 'abc123',
      commitBranch: 'aBranchName',
    }
    const pkgVersion = '0.0.0-development'

    beforeEach(() => {
      vi.mocked(util.pkgVersion).mockReset()
      vi.mocked(util.pkgBuildInfo).mockReset()
      vi.mocked(util.pkgBuildInfo).mockReturnValue(buildInfo)
      vi.mocked(util.pkgVersion).mockReturnValue(pkgVersion)
    })

    it('generates the expected URL', () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      expect(install._getBinaryUrlFromBuildInfo(pkgVersion, 'x64', buildInfo)).toEqual(`https://cdn.cypress.io/beta/binary/0.0.0-development/linux-x64/aBranchName-abc123/cypress.zip`)
    })

    it('overrides win32-arm64 to win32-x64 for pre-release', () => {
      vi.mocked(os.platform).mockReturnValue('win32')

      expect(install._getBinaryUrlFromBuildInfo(pkgVersion, 'arm64', buildInfo))
      .toEqual(`https://cdn.cypress.io/beta/binary/0.0.0-development/win32-x64/aBranchName-abc123/cypress.zip`)
    })
  })
})
