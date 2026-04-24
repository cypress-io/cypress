import { vi, describe, it, beforeEach, afterEach, expect, MockInstance } from 'vitest'
import path from 'path'
import chalk from 'chalk'
import _ from 'lodash'
import os from 'os'
import { stripIndent } from 'common-tags'
import mockfs from 'mock-fs'
import { geteuid } from 'process'
import { Console } from 'console'
import fs from 'fs-extra'
import si, { Systeminformation } from 'systeminformation'
import _xvfb from '@cypress/xvfb'
import stripAnsi from 'strip-ansi'
import { Listr } from 'listr2'

import util from '../../../lib/util'
import logger from '../../../lib/logger'
import xvfb from '../../../lib/exec/xvfb'
import { verifyTestRunnerTimeoutMs, start, needsSandbox } from '../../../lib/tasks/verify'

const packageVersion = '1.2.3'
const cacheDir = '/cache/Cypress'
const executablePath = '/cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress'
const binaryStatePath = '/cache/Cypress/1.2.3/binary_state.json'
const DEFAULT_VERIFY_TIMEOUT = 30000

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

vi.mock('@cypress/xvfb', async () => {
  const XVFB_MOCK = vi.fn()

  XVFB_MOCK.prototype.start = vi.fn()

  return {
    default: XVFB_MOCK,
  }
})

vi.mock('lodash', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      random: vi.fn(),
    },
  }
})

vi.mock('process', async (importActual) => {
  const actual = await importActual()

  return {
    geteuid: vi.fn(),
    default: {
      // @ts-expect-error
      ...actual.default,
      geteuid: vi.fn(),
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
      release: vi.fn(),
      arch: vi.fn(),
    },
  }
})

vi.mock('../../../lib/exec/xvfb', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      start: vi.fn(),
      stop: vi.fn(),
      isNeeded: vi.fn(),
      startAsync: vi.fn(),
    },
  }
})

vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      getCacheDir: vi.fn(),
      isCi: vi.fn(),
      pkgVersion: vi.fn(),
      exec: vi.fn(),
      getOsVersionAsync: vi.fn(),
      isPossibleLinuxWithIncorrectDisplay: vi.fn(),
      pkgBuildInfo: vi.fn(),
    },
  }
})

vi.mock('listr2', async (importActual) => {
  const actual = await importActual<typeof import('listr2')>()
  const { Listr } = actual

  return {
    ...actual,
    Listr: vi.fn(function (this: unknown, ...args: ConstructorParameters<typeof Listr>) {
      return new Listr(...args)
    }),
  }
})

describe('lib/tasks/verify', () => {
  const createStdoutCapture = () => {
    const logs: string[] = []
    const originalOut = process.stdout.write

    vi.spyOn(process.stdout, 'write').mockImplementation((...args: Parameters<typeof process.stdout.write>) => {
      const chunk = args[0]

      if (typeof chunk === 'string') {
        logs.push(chunk)
      }

      // Must preserve `stdout` as `this` — unbound calls break Writable (_writableState).
      return originalOut.apply(process.stdout, args)
    })

    return () => logs.join('')
  }

  /** listr2/chalk add ANSI; strip for stable substring assertions. */
  const plain = (getOutput: () => string): string => stripAnsi(getOutput())
  let spawnedProcess: any
  // Direct console to process.stdout/stderr
  let originalConsole: Console

  let previousChalkLevel: 0 | 1 | 2 | 3

  beforeEach(() => {
    previousChalkLevel = chalk.level
    chalk.level = 3

    vi.resetAllMocks()
    vi.unstubAllEnvs()

    vi.stubEnv('npm_config_loglevel', 'notice')
    // Align `state.getCacheDir()` with mock-fs fixtures (stable across CI/sandbox vs real cachedir()).
    vi.stubEnv('CYPRESS_CACHE_FOLDER', '/cache/Cypress')

    originalConsole = globalThis.console

    globalThis.console = new Console(process.stdout, process.stderr)

    spawnedProcess = {
      code: 0,
      stderr: vi.fn(),
      stdout: '222',
    }

    vi.mocked(os.platform).mockReturnValue('darwin')
    vi.mocked(os.release).mockReturnValue('0.0.0')
    vi.mocked(os.arch).mockReturnValue('x64')
    vi.mocked(si.osInfo).mockResolvedValue({
      distro: 'Foo',
      release: 'OsVersion',
    } as Systeminformation.OsData)

    vi.mocked(util.getCacheDir).mockReturnValue(cacheDir)
    vi.mocked(util.isCi).mockReturnValue(false)
    vi.mocked(util.pkgVersion).mockReturnValue(packageVersion)
    vi.mocked(util.pkgBuildInfo).mockReturnValue({
      stable: true,
      commitBranch: 'main',
      commitSha: 'abcdef123456',
      commitDate: '1970-01-01T05:00:00.000Z',
    })

    vi.mocked(xvfb.start).mockResolvedValue(undefined)
    vi.mocked(xvfb.stop).mockResolvedValue(null)
    vi.mocked(xvfb.isNeeded).mockReturnValue(false)
    /// @ts-expect-error - geteuid is potentially undefined
    vi.mocked(geteuid).mockReturnValue(1000)
    vi.mocked(_.random).mockReturnValue(222)
    // @ts-expect-error - mock args
    vi.mocked(util.exec).mockImplementation((...args: any) => {
      if (args[0] === executablePath && _.isEqual(args[1], ['--no-sandbox', '--smoke-test', '--ping=222'])) {
        return Promise.resolve(spawnedProcess)
      }

      return Promise.reject(new Error('should have caught error'))
    })
  })

  afterEach(() => {
    globalThis.console = originalConsole // Restore original console
    mockfs.restore()
    chalk.level = previousChalkLevel
  })

  it('has verify task timeout', () => {
    expect(verifyTestRunnerTimeoutMs()).toEqual(DEFAULT_VERIFY_TIMEOUT)
  })

  it('accepts custom verify task timeout', () => {
    vi.stubEnv('CYPRESS_VERIFY_TIMEOUT', '500000')
    expect(verifyTestRunnerTimeoutMs()).toEqual(500000)
  })

  it('accepts custom verify task timeout from npm', async () => {
    vi.stubEnv('npm_config_CYPRESS_VERIFY_TIMEOUT', '600000')
    expect(verifyTestRunnerTimeoutMs()).toEqual(600000)
  })

  it('falls back to default verify task timeout if custom value is invalid', async () => {
    vi.stubEnv('CYPRESS_VERIFY_TIMEOUT', 'foobar')
    expect(verifyTestRunnerTimeoutMs()).toEqual(DEFAULT_VERIFY_TIMEOUT)
  })

  it('returns early when `CYPRESS_SKIP_VERIFY` is set to true', async () => {
    vi.stubEnv('CYPRESS_SKIP_VERIFY', 'true')

    const result = await start()

    expect(result).toEqual(undefined)
  })

  it('logs error and exits when no version of Cypress is installed', async () => {
    const output = createStdoutCapture()

    try {
      await start()
      throw new Error('should have caught error')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)

      expect(message).not.toContain('should have caught error')
      logger.error(err)

      const out = plain(output)

      expect(out).toContain('No version of Cypress is installed')
      expect(out).toContain('/cache/Cypress/1.2.3/Cypress.app')
      expect(out).toContain('cypress install')
    }
  })

  it('adds --no-sandbox when user is root', async () => {
    // make it think the executable exists
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    // @ts-expect-error - geteuid is potentially undefined
    vi.mocked(geteuid).mockReturnValue(0) // user is root

    await start()

    expect(util.exec).toHaveBeenCalledWith(executablePath, ['--no-sandbox', '--smoke-test', '--ping=222'], expect.anything())
  })

  it('adds --no-sandbox when user is non-root', async () => {
    // make it think the executable exists
    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    // @ts-expect-error - geteuid is potentially undefined
    vi.mocked(geteuid).mockReturnValue(1000) // user is non-root

    await start()

    expect(util.exec).toHaveBeenCalledWith(executablePath, ['--no-sandbox', '--smoke-test', '--ping=222'], expect.anything())
  })

  it('is noop when binary is already verified', async () => {
    const output = createStdoutCapture()

    // make it think the executable exists and is verified
    createfs({
      alreadyVerified: true,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    await start()

    expect(output()).toEqual('')

    expect(util.exec).not.toHaveBeenCalled()
  })

  it('logs warning when installed version does not match verified version', async () => {
    const output = createStdoutCapture()

    createfs({
      alreadyVerified: true,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion: 'bloop',
    })

    await start()

    const out = plain(output)

    expect(out).toContain('Found binary version bloop')
    expect(out).toContain('does not match the expected package version')
    expect(out).toContain('1.2.3')
  })

  it('logs error and exits when executable cannot be found', async () => {
    const output = createStdoutCapture()

    try {
      await start()
      throw new Error('should have caught error')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)

      expect(message).not.toContain('should have caught error')
      logger.error(err)

      const out = plain(output)

      expect(out).toContain('No version of Cypress is installed')
      expect(out).toContain('cypress install')
    }
  })

  it('logs error when child process hangs', async () => {
    const output = createStdoutCapture()

    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    vi.mocked(util.exec).mockRejectedValue({
      stderr: 'some stderr',
      stdout: 'some stdout',
      timedOut: true,
    })

    try {
      await start({ smokeTestTimeout: 1 })
    } catch (err) {
      logger.error(err)

      const out = plain(output)

      expect(out).toContain('Cypress verification timed out')
      expect(out).toContain('some stderr')
    }
  })

  it('logs error when child process returns incorrect stdout (stderr when exists)', async () => {
    const output = createStdoutCapture()

    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    vi.mocked(util.exec).mockRejectedValue({
      stderr: 'some stderr',
      stdout: 'some stdout',
      code: 0,
    })

    try {
      await start({ smokeTestTimeout: 1 })
    } catch (err) {
      logger.error(err)

      const out = plain(output)

      expect(out).toContain('Cypress failed to start')
      expect(out).toContain('some stderr')
      expect(out).toContain('on.cypress.io/required-dependencies')
    }
  })

  it('logs error when child process returns incorrect stdout (stdout when no stderr)', async () => {
    const output = createStdoutCapture()

    createfs({
      alreadyVerified: false,
      executable: mockfs.file({ mode: 0o777 }),
      packageVersion,
    })

    vi.mocked(util.exec).mockRejectedValue({
      stdout: 'some stdout',
      code: 0,
    })

    try {
      await start({ smokeTestTimeout: 1 })
    } catch (err) {
      logger.error(err)

      const out = plain(output)

      expect(out).toContain('Cypress failed to start')
      expect(out).toContain('on.cypress.io/required-dependencies')
    }
  })

  describe('FORCE_COLOR', () => {
    beforeEach(() => {
      vi.stubEnv('FORCE_COLOR', 'true')
    })

    // @see https://github.com/cypress-io/cypress/issues/28982
    it('sets FORCE_COLOR to 0 when piping stdioOptions to to the smoke test to avoid ANSI in binary smoke test', async () => {
      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })

      vi.mocked(util.exec).mockResolvedValue({
        stdout: '222',
        stderr: '',
      } as any)

      await start()

      expect(util.exec).toHaveBeenCalledWith(
        executablePath,
        ['--no-sandbox', '--smoke-test', '--ping=222'],
        expect.objectContaining({ env: expect.objectContaining({ FORCE_COLOR: '0' }) }),
      )
    })
  })

  describe('with force: true', () => {
    beforeEach(() => {
      createfs({
        alreadyVerified: true,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })
    })

    it('shows full path to executable when verifying', async () => {
      const output = createStdoutCapture()

      await start({ force: true })

      expect(plain(output)).toContain('Opening Cypress...')
    })

    it('clears verified version from state if verification fails', async () => {
      const output = createStdoutCapture()

      vi.mocked(util.exec).mockRejectedValue({
        code: 1,
        stderr: 'an error about dependencies',
      })

      try {
        await start({ force: true })
        throw new Error('Should have thrown')
      } catch (err) {
        logger.error(err)
      }

      const exists = await fs.pathExists(binaryStatePath)

      expect(exists).toEqual(false)

      const out = plain(output)

      expect(out).toContain('Cypress failed to start')
      expect(out).toContain('an error about dependencies')
    })
  })

  describe('smoke test with DEBUG output', () => {
    beforeEach(() => {
      const stdoutWithDebugOutput = stripIndent`
          some debug output
          date: more debug output
          222
          after that more text
        `

      // @ts-expect-error - mock args
      vi.mocked(util.exec).mockImplementation((...args: any) => {
        if (args[0] === executablePath) {
          return Promise.resolve({
            stdout: stdoutWithDebugOutput,
          })
        }

        return Promise.reject(new Error('should have caught error'))
      })

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })
    })

    it('finds ping value in the verbose output', async () => {
      const output = createStdoutCapture()

      await start()

      expect(util.exec).toHaveBeenCalled()
      expect(plain(output)).toContain('Opening Cypress...')
    })
  })

  describe('smoke test retries on bad display with our Xvfb', () => {
    let loggerWarnSpy: MockInstance<(...messages: any[]) => void>

    beforeEach(() => {
      vi.stubEnv('DISPLAY', 'test-display')

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })

      loggerWarnSpy = vi.spyOn(logger, 'warn')
    })

    it('successfully retries with our Xvfb on Linux', async () => {
      // initially we think the user has everything set
      vi.mocked(xvfb.isNeeded).mockReturnValue(false)
      vi.mocked(util.isPossibleLinuxWithIncorrectDisplay).mockReturnValue(true)
      // @ts-expect-error - mock args
      vi.mocked(util.exec).mockImplementationOnce((...args: any) => {
        const firstSpawnError: any = new Error('')

        // this message contains typical Gtk error shown if X11 is incorrect
        // like in the case of DISPLAY=987
        firstSpawnError.stderr = stripIndent`
            [some noise here] Gtk: cannot open display: 987
              and maybe a few other lines here with weird indent
          `

        firstSpawnError.stdout = ''

        // the second time the binary returns expected ping
        // @ts-expect-error - mock args
        vi.mocked(util.exec).mockImplementationOnce((...args: any) => {
          if (args[0] === executablePath) {
            return Promise.resolve({
              stdout: '222',
            })
          }
        })

        return Promise.reject(firstSpawnError)
      })

      await start()

      expect(util.exec).toHaveBeenCalledTimes(2)
      // user should have been warned
      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining(
        'This is likely due to a misconfigured DISPLAY environment variable.',
      ))
    })

    it('fails on both retries with our Xvfb on Linux', async () => {
      // initially we think the user has everything set
      vi.mocked(xvfb.isNeeded).mockReturnValue(false)
      vi.mocked(util.isPossibleLinuxWithIncorrectDisplay).mockReturnValue(true)
      // @ts-expect-error - mock args
      vi.mocked(util.exec).mockImplementationOnce((...args: any) => {
        vi.mocked(os.platform).mockReturnValue('linux')
        expect(xvfb.start).not.toHaveBeenCalled()

        const firstSpawnError: any = new Error('')

        // this message contains typical Gtk error shown if X11 is incorrect
        // like in the case of DISPLAY=987
        firstSpawnError.stderr = stripIndent`
                  [some noise here] Gtk: cannot open display: 987
                    and maybe a few other lines here with weird indent
                `

        firstSpawnError.stdout = ''

        // the second time it runs, it fails for some other reason
        const secondMessage = stripIndent`
                  [some noise here] Gtk: cannot open display: 987
                  some other error
                    again with
                      some weird indent
                `

        // @ts-expect-error - mock args
        vi.mocked(util.exec).mockImplementationOnce((...args: any) => {
          if (args[0] === executablePath) {
            return Promise.reject(new Error(secondMessage))
          }
        })

        return Promise.reject(firstSpawnError)
      })

      try {
        await start()
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)

        expect(util.exec).toHaveBeenCalledTimes(2)
        // second time around we should have called Xvfb
        expect(xvfb.start).toHaveBeenCalledTimes(1)
        expect(xvfb.stop).toHaveBeenCalledTimes(1)

        // user should have been warned
        expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('DISPLAY was set to: "test-display"'))

        expect(message).toContain('Cypress verification failed')
        expect(message).toContain('Gtk: cannot open display: 987')
        expect(message).toContain('some other error')

        return
      }

      throw new Error('Should have failed')
    })

    it('logs an error if Cypress executable does not exist', async () => {
      const output = createStdoutCapture()

      createfs({
        alreadyVerified: false,
        executable: false,
        packageVersion,
      })

      try {
        await start()
      } catch (err) {
        logger.error(err)

        const out = plain(output)

        expect(out).toContain('No version of Cypress is installed')
        expect(out).toContain('cypress install')

        return
      }

      throw new Error('Should have thrown')
    })

    it('logs an error if Cypress executable does not have permissions', async () => {
      const output = createStdoutCapture()

      mockfs.restore()

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o666 }),
        packageVersion,
      })

      try {
        await start()
      } catch (err) {
        logger.error(err)

        const out = plain(output)

        expect(out).toContain('does not have executable permissions')
        expect(out).toContain(executablePath)

        return
      }

      throw new Error('Should have thrown')
    })

    it('logs and runs when current version has not been verified', async () => {
      const output = createStdoutCapture()

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })

      await start()

      const out = plain(output)

      expect(out).toContain('first time using Cypress')
      expect(out).toContain('Opening Cypress...')
    })

    it('logs and runs when installed version is different than package version', async () => {
      const output = createStdoutCapture()

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion: '7.8.9',
      })

      await start()

      const out = plain(output)

      expect(out).toContain('Found binary version 7.8.9')
      expect(out).toContain('does not match the expected package version')
      expect(out).toContain('first time using Cypress')
    })

    it('is silent when logLevel is silent', async () => {
      const output = createStdoutCapture()

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })

      vi.stubEnv('npm_config_loglevel', 'silent')

      await start()

      expect(output()).toEqual('')
    })

    it('turns off Opening Cypress...', async () => {
      const output = createStdoutCapture()

      createfs({
        alreadyVerified: true,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion: '7.8.9',
      })

      await start({ welcomeMessage: false })

      const out = plain(output)

      expect(out).not.toContain('Opening Cypress...')
      expect(out).toContain('7.8.9')
      expect(out).toContain('does not match')
    })

    it('logs error when fails smoke test unexpectedly without stderr', async () => {
      const output = createStdoutCapture()

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })

      vi.mocked(util.exec).mockRejectedValue({
        stderr: '',
        stdout: '',
        message: 'Error: EPERM NOT PERMITTED',
      })

      try {
        await start()
      } catch (err) {
        logger.error(err)

        const out = plain(output)

        expect(out).toContain('Cypress failed to start')
        expect(out).toContain('EPERM NOT PERMITTED')

        return
      }

      throw new Error('Should have thrown')
    })
  })

  describe('on linux', () => {
    beforeEach(() => {
      vi.mocked(xvfb.isNeeded).mockReturnValue(true)

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })
    })

    it('starts xvfb', async () => {
      await start()

      expect(xvfb.start).toHaveBeenCalled()
    })

    it('stops xvfb on spawned process close', async () => {
      await start()

      expect(xvfb.stop).toHaveBeenCalled()
    })

    it('logs error and exits when starting xvfb fails', async () => {
      const output = createStdoutCapture()

      const actualXvfb = (await vi.importActual<typeof import('../../../lib/exec/xvfb')>('../../../lib/exec/xvfb')).default

      vi.mocked(xvfb.start).mockImplementation(actualXvfb.start)

      const err: any = new Error('test without xvfb')

      err.nonZeroExitCode = true
      err.stack = 'xvfb? no dice'

      // stub the xvfb module to test integration
      vi.spyOn(_xvfb.prototype, 'start').mockImplementation((cb) => {
        // mock a failure
        cb(err)
      })

      try {
        await start()
      } catch (err) {
        logger.error(err)

        const out = plain(output)

        expect(out).toContain('Xvfb exited')
        expect(out).toContain('test without xvfb')

        return
      }

      throw new Error('Should have thrown')
    })
  })

  describe('when running in CI', () => {
    beforeEach(() => {
      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
      })

      vi.mocked(util.isCi).mockReturnValue(true)
    })

    it('logs error when binary not found', async () => {
      const output = createStdoutCapture()

      mockfs({})

      try {
        await start()
      } catch (err) {
        logger.error(err)

        const out = plain(output)

        expect(out).toContain('Cypress binary is missing')
        expect(out).toContain('/cache/Cypress')
        expect(out).toContain('not-installed-ci-error')

        return
      }

      throw new Error('Should have thrown')
    })
  })

  describe('when env var CYPRESS_RUN_BINARY', async () => {
    it('can validate and use executable', async () => {
      const output = createStdoutCapture()

      const envBinaryPath = '/custom/Contents/MacOS/Cypress'
      const realEnvBinaryPath = `/real${envBinaryPath}`

      vi.stubEnv('CYPRESS_RUN_BINARY', envBinaryPath)

      createfs({
        alreadyVerified: false,
        executable: mockfs.file({ mode: 0o777 }),
        packageVersion,
        customDir: '/real/custom',
      })

      // @ts-expect-error - mock args
      vi.mocked(util.exec).mockImplementation((...args: any) => {
        if (args[0] === realEnvBinaryPath && _.isEqual(args[1], ['--no-sandbox', '--smoke-test', '--ping=222'])) {
          return Promise.resolve(spawnedProcess)
        }

        return Promise.reject(new Error('should have caught error'))
      })

      await start()

      expect(util.exec).toHaveBeenCalledWith(realEnvBinaryPath, ['--no-sandbox', '--smoke-test', '--ping=222'], expect.anything())
      expect(plain(output)).toContain('Opening Cypress...')
    })

    for (const platform of ['darwin', 'linux', 'win32']) {
      it(`can log error to user on ${platform}`, async () => {
        const output = createStdoutCapture()

        vi.stubEnv('CYPRESS_RUN_BINARY', '/custom/')

        vi.mocked(os.platform).mockReturnValue(platform as NodeJS.Platform)

        try {
          await start()
        } catch (err) {
          logger.error(err)

          const out = plain(output)

          expect(out).toContain('Could not run binary set by environment variable')
          expect(out).toContain('ENOENT')

          if (platform === 'darwin') {
            expect(out).toContain('Contents/MacOS/Cypress')
          } else if (platform === 'linux') {
            expect(out).toContain('**/Cypress')
          } else {
            expect(out).toContain('Cypress.exe')
          }

          return
        }

        throw new Error('Should have thrown')
      })
    }
  })

  // tests for when Electron needs "--no-sandbox" CLI flag
  describe('.needsSandbox', () => {
    it('needs --no-sandbox on Linux as a root', () => {
      vi.mocked(os.platform).mockReturnValue('linux')

      // @ts-expect-error - geteuid is potentially undefined
      vi.mocked(geteuid).mockReturnValue(0)
      expect(needsSandbox()).toEqual(true)
    })

    it('needs --no-sandbox on Linux as a non-root', () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      // @ts-expect-error - geteuid is potentially undefined
      vi.mocked(geteuid).mockReturnValue(1000)
      expect(needsSandbox()).toEqual(true)
    })

    it('needs --no-sandbox on Mac as a non-root', () => {
      vi.mocked(os.platform).mockReturnValue('darwin')
      // @ts-expect-error - geteuid is potentially undefined
      vi.mocked(geteuid).mockReturnValue(1000)
      expect(needsSandbox()).toEqual(true)
    })

    it('does not need --no-sandbox on Windows', () => {
      vi.mocked(os.platform).mockReturnValue('win32')
      expect(needsSandbox()).toEqual(false)
    })
  })
})

// TODO this needs documentation with examples badly.
function createfs ({ alreadyVerified, executable, packageVersion, customDir }: any) {
  if (!customDir) {
    customDir = '/cache/Cypress/1.2.3/Cypress.app'
  }

  // binary state is stored one folder higher than the runner itself
  // see https://github.com/cypress-io/cypress/issues/6089
  const binaryStateFolder = path.join(customDir, '..')

  const binaryState = {
    verified: alreadyVerified,
  }
  const binaryStateText = JSON.stringify(binaryState)

  let mockFiles: any = {
    [binaryStateFolder]: {
      'binary_state.json': binaryStateText,
    },
    [customDir]: {
      Contents: {
        MacOS: executable
          ? {
            Cypress: executable,
          }
          : {},
        Resources: {
          app: {
            'package.json': `{"version": "${packageVersion}"}`,
          },
        },
      },
    },
  }

  if (customDir) {
    mockFiles['/custom/Contents/MacOS/Cypress'] = mockfs.symlink({
      path: '/real/custom/Contents/MacOS/Cypress',
      mode: 0o777,
    })
  }

  return mockfs(mockFiles)
}
