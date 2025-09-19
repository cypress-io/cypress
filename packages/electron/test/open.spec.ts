import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { access, remove, ensureSymlink } from 'fs-extra'
import { getPathToResources, getSymlinkType, getPathToExec } from '../src/paths'
import { filter, DEBUG_PREFIX } from '@packages/stderr-filtering'
import { Writable } from 'stream'
import inspector from 'inspector'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import Debug from 'debug'
import os from 'os'

import { open } from '../src/open'

vi.mock('path')
vi.mock('fs-extra', () => {
  return {
    access: vi.fn(),
    remove: vi.fn(),
    ensureSymlink: vi.fn(),
  }
})

vi.mock('../src/paths', () => {
  return {
    getPathToResources: vi.fn(),
    getSymlinkType: vi.fn(),
    getPathToExec: vi.fn(),
  }
})

vi.mock('child_process', async () => {
  return {
    ...await vi.importActual('child_process'),
    spawn: vi.fn(),
  }
})

vi.mock('@packages/stderr-filtering', () => {
  return {
    filter: vi.fn(),
    DEBUG_PREFIX: 'DEBUG_PREFIX',
  }
})

vi.mock('../src/inspectArgument', () => {
  return {
    getInspectFromUrl: vi.fn(),
    getInspectFromOpts: vi.fn(),
  }
})

vi.mock('inspector')
vi.mock('child_process')
vi.mock('os')
vi.mock('debug')
describe('open', () => {
  let argv: string[]
  let mockChildProcess: ChildProcessWithoutNullStreams
  const execPath = 'path/to/exec'
  const resourcesPath = 'path/to/resources'
  const appPath = 'path/to/app'
  let mockProcessStdoutWritePipe: Writable
  let mockProcessStdinWritePipe: Writable
  let mockFilterWriter: Writable
  let mockElectronDebugFn: Mock<ReturnType<typeof Debug>>
  let mockStderrDebugFn: Mock<ReturnType<typeof Debug>>

  beforeEach(() => {
    // @ts-expect-error
    mockChildProcess = vi.mocked<ChildProcess>({
      on: vi.fn(),
      stderr: {
        pipe: vi.fn(),
      },
      stdout: {
        pipe: vi.fn(),
      },
      stdin: {
        pipe: vi.fn(),
      },
    })

    // @ts-expect-error
    mockProcessStdoutWritePipe = vi.mocked<Writable>({
      pipe: vi.fn(),
    })

    // @ts-expect-error
    mockProcessStdinWritePipe = vi.mocked<Writable>({
      pipe: vi.fn(),
    })

    // @ts-expect-error
    mockFilterWriter = vi.mocked<Writable>({
      pipe: vi.fn(),
    })

    vi.spyOn(process.stdout, 'pipe').mockReturnValue(mockProcessStdoutWritePipe)
    vi.spyOn(process.stdin, 'pipe').mockReturnValue(mockProcessStdinWritePipe)

    // happy path defaults
    argv = ['--port', '1234']
    vi.spyOn(inspector, 'url').mockReturnValue(undefined)
    vi.mocked(spawn).mockReturnValue(mockChildProcess)
    vi.mocked(access).mockResolvedValue(undefined)
    vi.mocked(remove).mockResolvedValue(undefined)
    vi.mocked(ensureSymlink).mockResolvedValue(undefined)
    vi.mocked(getPathToExec).mockReturnValue(execPath)
    vi.mocked(getPathToResources).mockReturnValue(resourcesPath)
    vi.mocked(getSymlinkType).mockReturnValue('dir')
    vi.mocked(filter).mockReturnValue(mockFilterWriter)
    mockElectronDebugFn = vi.fn()
    mockStderrDebugFn = vi.fn()
    // @ts-expect-error
    vi.mocked(Debug).mockImplementation((ns) => {
      if (ns === 'cypress:electron') {
        return mockElectronDebugFn
      }

      if (ns === 'cypress:internal-stderr') {
        return mockStderrDebugFn
      }
    })

    // @ts-expect-error
    vi.spyOn(process, 'exit').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('opens the electron app and returns the child process', async () => {
    const result = await open(appPath, argv)

    expect(spawn).toHaveBeenCalledWith(execPath, argv, { stdio: 'pipe' })
    expect(filter).toHaveBeenCalledWith(process.stderr, expect.any(Function), DEBUG_PREFIX)
    expect(result).toBe(mockChildProcess)

    expect(mockChildProcess.stdout.pipe).toHaveBeenCalledWith(process.stdout)
    expect(process.stdin.pipe).toHaveBeenCalledWith(mockChildProcess.stdin)
  })

  describe('when in develop env', () => {
    beforeEach(() => {
      vi.stubEnv('CYPRESS_INTERNAL_ENV', 'development')
    })

    it('pipes child stderr direct to process stderr', async () => {
      await open(appPath, argv)

      expect(filter).not.toHaveBeenCalled()
      expect(mockChildProcess.stderr.pipe).toHaveBeenCalledWith(process.stderr)
    })
  })

  describe('when electron logging is enabled via debug', () => {
    beforeEach(() => {
      // @ts-expect-error
      mockElectronDebugFn.enabled = true
    })

    it('pipes child stderr direct to process stderr', async () => {
      await open(appPath, argv)
      expect(spawn).toHaveBeenCalledWith(execPath, expect.arrayContaining(['--enable-logging']), { stdio: 'pipe' })
      expect(filter).not.toHaveBeenCalled()
      expect(mockChildProcess.stderr.pipe).toHaveBeenCalledWith(process.stderr)
    })
  })

  describe('when electron logging is enabled via ELECTRON_ENABLE_LOGGING', () => {
    beforeEach(() => {
      vi.stubEnv('ELECTRON_ENABLE_LOGGING', '1')
    })

    it('pipes child stderr direct to process stderr', async () => {
      await open(appPath, argv)
      expect(spawn).toHaveBeenCalledWith(execPath, argv, { stdio: 'pipe' })
      expect(filter).not.toHaveBeenCalled()
      expect(mockChildProcess.stderr.pipe).toHaveBeenCalledWith(process.stderr)
    })
  })

  describe('when in non develop env, electron debug disabled, and enable logging is disabled', () => {
    beforeEach(() => {
      vi.stubEnv('CYPRESS_INTERNAL_ENV', 'production')
      vi.stubEnv('ELECTRON_ENABLE_LOGGING', '0')
      // @ts-expect-error
      mockElectronDebugFn.enabled = false
    })

    it('filters child stderr', async () => {
      await open(appPath, argv)
      expect(filter).toHaveBeenCalledWith(process.stderr, expect.any(Function), DEBUG_PREFIX)
      expect(mockChildProcess.stderr.pipe, 'child stderr pipe').not.toHaveBeenCalledWith(process.stderr)
    })
  })

  describe('when platform is linux', () => {
    beforeEach(() => {
      vi.spyOn(os, 'platform').mockReturnValue('linux')
    })

    describe('anmd geteuid returns 0', () => {
      beforeEach(() => {
        // @ts-expect-error
        vi.spyOn(process, 'geteuid').mockReturnValue(0)
      })

      it('spawns with --no-sandbox', async () => {
        await open(appPath, argv)
        expect(spawn).toHaveBeenCalledWith(execPath, expect.arrayContaining(['--no-sandbox']), { stdio: 'pipe' })
      })
    })

    describe('and geteuid returns 1000', () => {
      beforeEach(() => {
        // @ts-expect-error

        vi.spyOn(process, 'geteuid').mockReturnValue(1000)
      })

      it('spawns without --no-sandbox', async () => {
        await open(appPath, argv)
        expect(spawn).toHaveBeenCalledWith(execPath, expect.not.arrayContaining(['--no-sandbox']), { stdio: 'pipe' })
      })
    })

    describe('and geteuid is undefined', () => {
      let originalGeteuid: typeof process.geteuid

      beforeEach(() => {
        originalGeteuid = process.geteuid
        Object.defineProperty(process, 'geteuid', {
          value: undefined,
          writable: true,
        })
      })

      afterEach(() => {
        Object.defineProperty(process, 'geteuid', {
          value: originalGeteuid,
          writable: true,
        })
      })

      it('spawns without --no-sandbox', async () => {
        await open(appPath, argv)
        expect(spawn).toHaveBeenCalledWith(execPath, expect.not.arrayContaining(['--no-sandbox']), { stdio: 'pipe' })
      })
    })
  })

  describe('child process', () => {
    let errCb: (err: Error) => void
    let closeCb: (code: number, signal: NodeJS.Signals | null) => void

    beforeEach(async () => {
      vi.spyOn(process, 'exit')
      vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(mockChildProcess.on).mockImplementation((event: string, fn) => {
        if (event === 'error') {
          errCb = fn
        } else if (event === 'close') {
          closeCb = fn
        }

        return mockChildProcess
      })

      await open(appPath, argv)
    })

    describe('emits error', () => {
      it('writes the error to stderr and exit with code 1', () => {
        const err = new Error('test error')

        errCb(err)

        expect(process.exit).toHaveBeenCalledWith(1)

        expect(console.error).toHaveBeenCalledWith(err)
      })
    })

    describe('emits close', () => {
      describe('with null signal', () => {
        it('exits with code 0', () => {
          closeCb(0, null)

          expect(process.exit).toHaveBeenCalledWith(0)
        })
      })

      describe('with a signal', () => {
        it('exits with code 1', () => {
          closeCb(1, 'SIGKILL')

          expect(process.exit).toHaveBeenCalledWith(1)
        })
      })
    })
  })

  describe('when inspector.url() returns a URL', () => {
    const port = 9229
    const nextPort = 9230

    beforeEach(() => {
      vi.spyOn(process, 'exit')
      vi.spyOn(process, 'debugPort', 'get').mockReturnValue(port)
      vi.mocked(inspector.url).mockReturnValue(`ws://127.0.0.1:${port}`)
    })

    describe('when process.execArgv has --inspect', () => {
      beforeEach(() => {
        vi.spyOn(process, 'execArgv', 'get').mockReturnValue(['--inspect'])
      })

      it('uses --inspect with incremented port', async () => {
        await open(appPath, argv)
        expect(spawn).toHaveBeenCalledWith(execPath, expect.arrayContaining([`--inspect=${nextPort}`]), { stdio: 'pipe' })
      })
    })

    describe('when process.execArgv has --inspect-brk', () => {
      beforeEach(() => {
        vi.spyOn(process, 'execArgv', 'get').mockReturnValue(['--inspect-brk'])
      })

      it('uses --inspect-brk with incremented port', async () => {
        await open(appPath, argv)
        expect(spawn).toHaveBeenCalledWith(execPath, expect.arrayContaining([`--inspect-brk=${nextPort}`]), { stdio: 'pipe' })
      })
    })

    describe('when process.execArgv has no --inspect or --inspect-brk', () => {
      beforeEach(() => {
        vi.spyOn(process, 'execArgv', 'get').mockReturnValue([])
      })

      it('uses --inspect-brk with incremented port', async () => {
        await open(appPath, argv)
        expect(spawn).toHaveBeenCalledWith(execPath, expect.arrayContaining([`--inspect-brk=${nextPort}`]), { stdio: 'pipe' })
      })
    })
  })

  describe('when inspector.url() returns undefined', () => {
    beforeEach(() => {
      vi.mocked(inspector.url).mockReturnValue(undefined)
    })

    describe('but argv has --inspectBrk', () => {
      beforeEach(() => {
        argv.push('--inspectBrk')
      })

      describe('and CYPRESS_DOCKER_DEV_INSPECT_OVERRIDE is set', () => {
        const overridePort = '1234'

        beforeEach(() => {
          vi.stubEnv('CYPRESS_DOCKER_DEV_INSPECT_OVERRIDE', overridePort)
        })

        it('uses --inspect-brk with the override', async () => {
          await open(appPath, argv)
          expect(spawn).toHaveBeenCalledWith(execPath, expect.arrayContaining([`--inspect-brk=${overridePort}`]), { stdio: 'pipe' })
        })
      })

      describe('and CYPRESS_DOCKER_DEV_INSPECT_OVERRIDE is not set', () => {
        beforeEach(() => {
          vi.stubEnv('CYPRESS_DOCKER_DEV_INSPECT_OVERRIDE', '')
        })

        it('uses --inspect-brk with default port', async () => {
          await open(appPath, argv)
          expect(spawn).toHaveBeenCalledWith(execPath, expect.arrayContaining([`--inspect-brk=5566`]), { stdio: 'pipe' })
        })
      })
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      vi.spyOn(console, 'debug').mockImplementation(() => {})

      vi.mocked(console.debug).mockName('console.debug')
    })

    describe('when file access fails', () => {
      beforeEach(() => {
        vi.mocked(access).mockRejectedValue(new Error('File not found'))
      })

      it('logs error stack and exits with code 1', async () => {
        await expect(open('nonexistent/path', argv))

        expect(console.debug).toHaveBeenCalledWith(expect.any(String))
        expect(process.exit).toHaveBeenCalledWith(1)
      })
    })

    describe('when symlink creation fails', () => {
      beforeEach(() => {
        vi.mocked(ensureSymlink).mockRejectedValue(new Error('Permission denied'))
      })

      it('logs error stack and exits with code 1', async () => {
        await open(appPath, argv)

        expect(console.debug).toHaveBeenCalledWith(expect.any(String))
        expect(process.exit).toHaveBeenCalledWith(1)
      })
    })
  })
})
