import { vi, describe, it, beforeEach, expect } from 'vitest'
import cp from 'child_process'
import os from 'os'
import tty from 'tty'
import path from 'path'
import treeKill from 'tree-kill'
import si, { Systeminformation } from 'systeminformation'
import { EventEmitter } from 'events'
import readline from 'readline'
import createDebug from 'debug'
import { PassThrough } from 'stream'
import process, { stdin, stdout, stderr } from 'process'

import state from '../../../lib/tasks/state'
import xvfb from '../../../lib/exec/xvfb'
import { start } from '../../../lib/exec/spawn'
import { needsSandbox } from '../../../lib/tasks/verify'
import util from '../../../lib/util'
import { filter as stderrFilter } from '@packages/stderr-filtering'

const flushPromises = () => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 100)
  })
}

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

vi.mock('readline', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      createInterface: vi.fn(),
    },
  }
})

vi.mock('process', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    stdin: {
      ...actual.stdin,
      on: vi.fn(),
      emit: vi.fn(),
      pipe: vi.fn(),
      setRawMode: vi.fn(),
    },
    stdout: vi.fn(),
    stderr: {
      // @ts-expect-error
      ...actual.stderr,
      write: vi.fn(),
    },
    default: {
      // @ts-expect-error
      ...actual.default,
      stdin: {
        // @ts-expect-error
        ...actual.default.stdin,
        on: vi.fn(),
        emit: vi.fn(),
        pipe: vi.fn(),
        setRawMode: vi.fn(),
      },
      stdout: vi.fn(),
      stderr: {
        // @ts-expect-error
        ...actual.default.stderr,
        write: vi.fn(),
      },
      once: vi.fn(),
    },
  }
})

vi.mock('child_process', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      spawn: vi.fn(),
    },
  }
})

vi.mock('tty', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      isatty: vi.fn(),
    },
  }
})

vi.mock('tree-kill', () => {
  return {
    default: vi.fn(),
  }
})

vi.mock('@packages/stderr-filtering', () => {
  return {
    filter: vi.fn(),
    DEBUG_PREFIX: 'DEBUG_PREFIX',
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
    },
  }
})

vi.mock('../../../lib/tasks/state', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      getBinaryDir: vi.fn(),
      getPathToExecutable: vi.fn(),
    },
  }
})

vi.mock('../../../lib/tasks/verify', async () => {
  return {
    needsSandbox: vi.fn(),
  }
})

vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      supportsColor: vi.fn(),
    },
  }
})

const debug = createDebug('test')

const cwd = process.cwd()
const execPath = process.execPath
const nodeVersion = process.versions.node
const defaultBinaryDir = '/default/binary/dir'

describe('lib/exec/spawn', function () {
  let spawnedProcess: any
  let mockReadlineEventEmitter: any
  let stderrFilterMock: PassThrough

  beforeEach(function () {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('DISPLAY', undefined)

    vi.mocked(os.platform).mockReturnValue('darwin')
    vi.mocked(os.arch).mockReturnValue('x64')
    vi.mocked(si.osInfo).mockResolvedValue({
      distro: 'Foo',
      release: 'OsVersion',
    } as Systeminformation.OsData)

    spawnedProcess = new EventEmitter()
    spawnedProcess.unref = vi.fn().mockReturnValue(undefined)
    spawnedProcess.stdin = new PassThrough()
    vi.spyOn(spawnedProcess.stdin, 'on')
    vi.spyOn(spawnedProcess.stdin, 'pipe')

    spawnedProcess.stdout = {
      on: vi.fn().mockReturnValue(undefined),
      pipe: vi.fn().mockReturnValue(undefined),
    }

    spawnedProcess.stderr = {
      pipe: vi.fn().mockImplementation(function (this: any, dest: any) {
        this.on('data', (chunk: any) => dest?.write(chunk))

        return undefined
      }),
      on: vi.fn().mockReturnValue(undefined),
    }

    vi.spyOn(spawnedProcess, 'on')

    spawnedProcess.kill = vi.fn()

    mockReadlineEventEmitter = new EventEmitter()

    vi.mocked(readline.createInterface).mockReturnValue(mockReadlineEventEmitter)
    vi.mocked(cp.spawn).mockReturnValue(spawnedProcess)
    vi.mocked(xvfb.start).mockResolvedValue(undefined)
    vi.mocked(xvfb.stop).mockResolvedValue(undefined)
    vi.mocked(xvfb.isNeeded).mockReturnValue(false)
    vi.mocked(state.getBinaryDir).mockReturnValue(defaultBinaryDir)
    vi.mocked(state.getPathToExecutable).mockImplementation((args) => {
      if (args === '/default/binary/dir') {
        return '/path/to/cypress'
      }
    })

    // Default: pass-through so tests that assert on stderr.write still see data; filtering behavior lives in @packages/stderr-filtering
    // Must return a real stream (with .on) so sourceStream.pipe(filter(...)) in spawn.ts does not throw "dest.on is not a function"
    vi.mocked(stderrFilter).mockImplementation((dest: NodeJS.WritableStream) => {
      stderrFilterMock = new PassThrough()
      stderrFilterMock.on('data', (chunk: any) => {
        if (dest && typeof dest.write === 'function') dest.write(chunk)
      })

      vi.spyOn(stderrFilterMock, 'on')

      return stderrFilterMock as any
    })
  })

  describe('.start', function () {
    // ️️⚠️ NOTE ⚠️
    // when asserting the calls made to spawn the child Cypress process
    // we have to be _very_ careful. Spawn uses process.env object, if an assertion
    // fails, it will print the entire process.env object to the logs, which
    // might contain sensitive environment variables. Think about what the
    // failed assertion might print to the public CI logs and limit
    // the environment variables when running tests on CI.

    it('passes args + options to spawn', async () => {
      vi.mocked(needsSandbox).mockReturnValue(false)

      // start the process
      const startPromise = start('--foo', { foo: 'bar' })

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))

      // simulate the process closing successfully
      spawnedProcess.emit('close', 0)

      // await the process to complete and return
      await startPromise

      expect(cp.spawn).toHaveBeenCalledWith('/path/to/cypress', [
        '--',
        '--foo',
        '--cwd',
        cwd,
        '--userNodePath',
        execPath,
        '--userNodeVersion',
        nodeVersion,
      ], expect.objectContaining({
        detached: false,
        stdio: ['inherit', 'inherit', 'pipe'],
      }))
    })

    it('uses --no-sandbox when needed', async function () {
      vi.mocked(needsSandbox).mockReturnValue(true)

      const startPromise = start('--foo', { foo: 'bar' })

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // skip the options argument: we do not need anything about it
      // and also less risk that a failed assertion would dump the
      // entire ENV object with possible sensitive variables
      // @ts-expect-error - vitest mock
      const args = cp.spawn.mock.calls[0].slice(0, 2)

      // it is important for "--no-sandbox" to appear before "--" separator
      const expectedCliArgs = [
        '--no-sandbox',
        '--',
        '--foo',
        '--cwd',
        cwd,
        '--userNodePath',
        execPath,
        '--userNodeVersion',
        nodeVersion,
      ]

      expect(args).toEqual(['/path/to/cypress', expectedCliArgs])
    })

    it('uses npm command when running in dev mode', async () => {
      vi.mocked(needsSandbox).mockReturnValue(false)

      const startPromise = start('--foo', { dev: true, foo: 'bar' })

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // gets resolved relative to .<repo-root>/cli when running the test
      const p = path.resolve('../scripts/start.js')

      expect(cp.spawn).toHaveBeenCalledWith('node', [
        p,
        '--',
        '--foo',
        '--cwd',
        cwd,
        '--userNodePath',
        execPath,
        '--userNodeVersion',
        nodeVersion,
      ], expect.objectContaining({
        detached: false,
        stdio: ['inherit', 'inherit', 'pipe'],
      }))
    })

    it('does not pass --no-sandbox when running in dev mode', async function () {
      vi.mocked(needsSandbox).mockReturnValue(true)

      const startPromise = start('--foo', { dev: true, foo: 'bar' })

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // gets resolved relative to .<repo-root>/cli when running the test
      const p = path.resolve('../scripts/start.js')

      expect(cp.spawn).toHaveBeenCalledWith('node', [
        p,
        '--',
        '--foo',
        '--cwd',
        cwd,
        '--userNodePath',
        execPath,
        '--userNodeVersion',
        nodeVersion,
      ], expect.objectContaining({
        detached: false,
        stdio: ['inherit', 'inherit', 'pipe'],
      }))
    })

    it('starts xvfb when needed', async () => {
      vi.mocked(xvfb.isNeeded).mockReturnValue(true)

      const startPromise = start('--foo')

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      expect(xvfb.start).toBeCalled()
    })

    describe('closes', function () {
      ['close', 'exit'].forEach((event) => {
        it(`if '${event}' event fired`, async () => {
          const startPromise = start('--foo')

          await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
          spawnedProcess.emit(event, 0)

          const code = await startPromise

          expect(code).toEqual(0)
        })
      })

      it('if exit event fired and close event fired', async () => {
        const startPromise = start('--foo')

        await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
        await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('exit', expect.any(Function)))
        spawnedProcess.emit('exit', 0)
        spawnedProcess.emit('close', 0)

        const code = await startPromise

        expect(code).toEqual(0)
      })
    })

    describe('detects kill signal', async () => {
      it('exits with error on SIGKILL', async () => {
          const startPromise = start('--foo')

          await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('exit', expect.any(Function)))
          spawnedProcess.emit('exit', null, 'SIGKILL')

          await expect(startPromise).resolves.toEqual(137)
      })
    })

    describe('on signal exits', () => {
      for (const signal of ['SIGINT', 'SIGTERM'] as const) {
        it(`disables raw mode on ${signal}`, async () => {
          vi.mocked(process.stdin).isTTY = true
          const startPromise = start('--foo')

          await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
          await vi.waitFor(() => {
            expect(process.once).toHaveBeenCalledWith(signal, expect.any(Function))
          })

          const handler = vi.mocked(process.once).mock.calls.find((c) => c[0] === signal)?.[1] as () => void

          expect(handler).toBeDefined()
          await handler()

          spawnedProcess.emit('exit', null, signal)

          await startPromise

          expect(process.stdin.setRawMode).toHaveBeenCalledWith(false)
        })
      }
    })

    it('does not start xvfb when its not needed', async () => {
      const startPromise = start('--foo')

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      expect(xvfb.start).not.toBeCalled()
    })

    it('stops xvfb when spawn closes', async () => {
      vi.mocked(xvfb.isNeeded).mockReturnValue(true)

      const startPromise = start('--foo')

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      expect(xvfb.stop).toBeCalled()
    })

    it('resolves with spawned close code in the message', async () => {
      const startPromise = start('--foo')

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 10)

      const code = await startPromise

      expect(code).to.equal(10)
    })

    describe('Linux display', () => {
      beforeEach(() => {
        vi.stubEnv('DISPLAY', 'test-display')
      })

      it('retries with xvfb if fails with display exit code', async () => {
        // mock display missing
        spawnedProcess.stderr.on.mockImplementation((event, callback) => {
          if (event === 'data') {
            callback('[some noise here] Gtk: cannot open display: 987')
          }
        })

        vi.mocked(os.platform).mockReturnValue('linux')

        const startPromise = start('--foo')

        await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
        // mock display error due to missing display
        spawnedProcess.emit('close', 1)

        // mock the process actually starting up after xfvb is started
        await flushPromises()

        spawnedProcess.emit('close', 0)

        const code = await startPromise

        expect(xvfb.start).toHaveBeenCalledOnce()
        expect(xvfb.stop).toHaveBeenCalledOnce()
        expect(cp.spawn).toHaveBeenCalledTimes(2)
        // second code should be 0 after successfully running with Xvfb
        expect(code).toEqual(0)
      })
    })

    it('rejects with error from spawn', async () => {
      const msg = 'the error message'

      const startPromise = start('--foo')

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('error', expect.any(Function)))
      spawnedProcess.emit('error', new Error(msg))

      try {
        await startPromise

        throw new Error('should have hit error handler but did not')
      } catch (e) {
        debug('error message', (e as Error).message)
        expect((e as Error).message).toMatch(msg)
      }
    })

    describe('detached mode', () => {
      let stdoutDataHandler: ((data: Buffer) => void) | undefined

      beforeEach(() => {
        stdoutDataHandler = undefined

        spawnedProcess.stdout = {
          on: vi.fn().mockImplementation((event: string, handler: any) => {
            if (event === 'data') stdoutDataHandler = handler
          }),
          destroy: vi.fn(),
          pipe: vi.fn(),
        }

        spawnedProcess.stderr = {
          on: vi.fn(),
          pipe: vi.fn(),
          destroy: vi.fn(),
        }
      })

      it('waits for ready sentinel before unreffing and resolving', async () => {
        const startPromise = start(null, { detached: true })

        await vi.waitFor(() => expect(stdoutDataHandler).toBeDefined())

        expect(spawnedProcess.unref).not.toHaveBeenCalled()

        stdoutDataHandler!(Buffer.from('Cypress is ready\n'))

        await startPromise

        expect(spawnedProcess.unref).toHaveBeenCalledOnce()
        expect(spawnedProcess.stdout.destroy).toHaveBeenCalledOnce()
        expect(spawnedProcess.stderr.destroy).toHaveBeenCalledOnce()
      })

      it('resolves with exit code if process exits before ready message', async () => {
        const startPromise = start(null, { detached: true })

        await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
        spawnedProcess.emit('close', 1)

        const code = await startPromise

        expect(code).toBe(1)
        expect(spawnedProcess.unref).not.toHaveBeenCalled()
      })

      it('uses piped stdio when detached so startup errors are visible', async () => {
        const startPromise = start(null, { detached: true })

        await vi.waitFor(() => expect(stdoutDataHandler).toBeDefined())
        stdoutDataHandler!(Buffer.from('Cypress is ready\n'))
        await startPromise

        // @ts-expect-error - mock argument
        const thirdArg = cp.spawn.mock.calls[0][2]

        expect(thirdArg.stdio).toEqual(['ignore', 'pipe', 'pipe'])
      })

      it('passes --emit-when-ready to the Cypress process', async () => {
        const startPromise = start(null, { detached: true })

        await vi.waitFor(() => expect(stdoutDataHandler).toBeDefined())

        // @ts-expect-error - vitest mock
        const spawnArgs = cp.spawn.mock.calls[0][1]

        expect(spawnArgs).toContain('--emit-when-ready')

        stdoutDataHandler!(Buffer.from('Cypress is ready\n'))
        await startPromise
      })
    })

    it('does not unref by default', async () => {
      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = start()

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      expect(spawnedProcess.unref).not.toHaveBeenCalled()
    })

    it('sets process.env to options.env', async () => {
      vi.stubEnv('FOO', 'bar')

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = start()

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.env.FOO).toEqual('bar')
    })

    it('forces colors and streams when supported', async () => {
      vi.mocked(util.supportsColor).mockReturnValue(true)
      vi.mocked(tty.isatty).mockReturnValue(true)

      const startPromise = start([], { env: {} })

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.env).toMatchSnapshot()
    })

    it('sets windowsHide:false property in windows', async () => {
      vi.mocked(os.platform).mockReturnValue('win32')

      const startPromise = start([], { env: {} })

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.windowsHide).toEqual(false)
    })

    it('propagates treeKill if SIGINT is detected in windows console', async () => {
      spawnedProcess.pid = 7
      vi.mocked(os.platform).mockReturnValue('win32')

      const startPromise = start([], { env: {} })

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      mockReadlineEventEmitter.emit('SIGINT')
      // since the import of tree-kill is async inside spawn, we need to wait for it to be imported and called
      await flushPromises()

      expect(treeKill).toHaveBeenCalledWith(7, 'SIGINT')
    })

    it('does not set windowsHide property when in darwin', async () => {
      const startPromise = start([], { env: {} })

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.windowsHide).toBeUndefined()
    })

    it('does not force colors and streams when not supported', async () => {
      vi.mocked(util.supportsColor).mockReturnValue(false)
      vi.mocked(tty.isatty).mockReturnValue(false)

      const startPromise = start([], { env: {} })

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.env).toMatchSnapshot()
    })

    it('pipes when on win32', async () => {
      vi.mocked(os.platform).mockReturnValue('win32')

      vi.mocked(xvfb.isNeeded).mockReturnValue(false)

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = start()

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.stdio).toEqual('pipe')

      expect(stdin.pipe).toHaveBeenCalledOnce()
      expect(stdin.pipe).toHaveBeenCalledWith(spawnedProcess.stdin)
    })

    it('inherits when on linux and xvfb isn\'t needed', async () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      vi.mocked(xvfb.isNeeded).mockReturnValue(false)

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = start()

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.stdio).toEqual('inherit')
    })

    it('uses [inherit, inherit, pipe] when linux and xvfb is needed', async () => {
      vi.mocked(os.platform).mockReturnValue('linux')
      vi.mocked(xvfb.isNeeded).mockReturnValue(true)

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = start()

      await flushPromises()

      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.stdio).toEqual(['inherit', 'inherit', 'pipe'])
    })

    it('uses [inherit, inherit, pipe] on darwin', async () => {
      vi.mocked(os.platform).mockReturnValue('darwin')
      vi.mocked(xvfb.isNeeded).mockReturnValue(false)

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = start()

      await flushPromises()
      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.stdio).to.deep.eq([
        'inherit', 'inherit', 'pipe',
      ])
    })

    it('pipes child stderr through @packages/stderr-filtering when stderr is piped and not in dev/debug/logging', async () => {
      vi.mocked(os.platform).mockReturnValue('darwin')
      vi.mocked(xvfb.isNeeded).mockReturnValue(false)
      vi.stubEnv('ELECTRON_ENABLE_LOGGING', undefined)
      vi.stubEnv('CYPRESS_INTERNAL_ENV', undefined)

      let stderrDataCallback: (data: Buffer) => void

      spawnedProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') stderrDataCallback = callback
      })

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = start()

      await flushPromises()

      expect(stderrFilter).toHaveBeenCalledWith(stderr, expect.any(Function), 'DEBUG_PREFIX')

      // Data flows: child.stderr 'data' -> sourceStream -> filter return value -> stderr (async transform may need a tick)
      const buf = Buffer.from('stderr via sourceStream')

      stderrDataCallback!(buf)
      await new Promise((r) => setImmediate(r))
      await flushPromises()
      expect(stderr.write).toHaveBeenCalledWith(buf)

      spawnedProcess.emit('close', 0)
      await startPromise
    })

    it('writes everything on win32', async () => {
      vi.mocked(os.platform).mockReturnValue('win32')

      const buf1 = Buffer.from('asdf')

      let stderrDataCallback: (data: Buffer) => void

      spawnedProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') stderrDataCallback = callback
      })

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = start()

      await flushPromises()

      // Emit stderr data after sourceStream.pipe(filter()) is set up so it flows to stderr.write
      stderrDataCallback!(buf1)
      await new Promise((r) => setImmediate(r))
      await flushPromises()

      spawnedProcess.emit('close', 0)
      await startPromise

      expect(stderr.write).toHaveBeenCalledWith(buf1)
      expect(stdin.pipe).toHaveBeenCalledExactlyOnceWith(spawnedProcess.stdin)
      expect(spawnedProcess.stdout.pipe).toHaveBeenCalledExactlyOnceWith(stdout)
    })

    it('pipes stderr through @packages/stderr-filtering (filter can suppress or forward)', async () => {
      vi.mocked(os.platform).mockReturnValue('linux')

      const filteredOut = Buffer.from('ERROR:dbus/bus.cc:123: noise')
      const passedThrough = Buffer.from('Some other error message')

      const FILTER_PATTERN = /ERROR:dbus\/(bus|object_proxy)\.cc/

      // Return a real stream (with .on) so sourceStream.pipe(filter(...)) works; apply same filter logic
      vi.mocked(stderrFilter).mockImplementation((dest: NodeJS.WritableStream) => {
        const pt = new PassThrough()

        pt.on('data', (chunk: Buffer) => {
          const str = Buffer.isBuffer(chunk) ? chunk.toString() : chunk

          if (!FILTER_PATTERN.test(str)) dest.write(chunk)
        })

        return pt as any
      })

      let dataCallback: (data: Buffer) => void

      spawnedProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') dataCallback = callback
      })

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = start()

      await flushPromises()

      dataCallback!(filteredOut)
      await flushPromises()
      expect(stderr.write).not.toHaveBeenCalledWith('ERROR:dbus/bus.cc:123: noise')

      dataCallback!(passedThrough)
      await flushPromises()
      // sourceStream passes data through; filter dest.write receives Buffer
      expect(stderr.write).toHaveBeenCalledWith(passedThrough)

      spawnedProcess.emit('close', 0)
      await startPromise
    })

    // https://github.com/cypress-io/cypress/issues/1841
    // https://github.com/cypress-io/cypress/issues/5241
    const errCodes = ['EPIPE', 'ENOTCONN']

    describe('process.stdin error handling', () => {
      beforeEach(() => {
        const stdinEmitter = new EventEmitter()

        vi.mocked(stdin.on).mockImplementation((event, callback) => {
          console.log('spied on')

          stdinEmitter.on(event, callback)

          return stdin
        })

        vi.mocked(stdin.emit).mockImplementation((event, ...args) => {
          console.log('spied emit')

          stdinEmitter.emit(event, ...args)

          return stdin
        })
      })

      errCodes.forEach((errCode) => {
        it(`catches process.stdin errors and returns when code=${errCode}`, async () => {
          // @ts-expect-error - invalid number of arguments for given type
          const p = start()

          const err: any = new Error()

          err.code = errCode

          await vi.waitFor(() => expect(stdin.on).toHaveBeenCalledWith('error', expect.any(Function)))

          stdin.emit('error', err)

          // If the error is caught, p resolves when the child process exits rather than immediately rejecting
          spawnedProcess.emit('exit', 0)
          await expect(p).resolves.not.toThrow()
        })
      })

      it('throws process.stdin errors code!=EPIPE', async function () {
          // kick off the mock process
          // @ts-expect-error - invalid number of arguments for given type
        const p = start()

        await vi.waitFor(() => {
          return expect(stdin.on).toHaveBeenCalledWith('error', expect.any(Function))
        })

        const err = {
          message: 'wattttt',
          code: 'FAILWHALE',
        }

        stdin.emit('error', err)
        await expect(p).rejects.toThrow('wattttt')
      })
    })
  })
})
