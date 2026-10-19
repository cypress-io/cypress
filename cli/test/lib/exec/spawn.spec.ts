import { vi, describe, it, beforeEach, expect } from 'vitest'
import cp from 'child_process'
import os from 'os'
import tty from 'tty'
import path from 'path'
import treeKill from 'tree-kill'
import type { Systeminformation } from 'systeminformation'
import si from 'systeminformation'
import { EventEmitter } from 'events'
import readline from 'readline'
import createDebug from 'debug'
import { PassThrough } from 'stream'
import process, { stdin, stdout, stderr } from 'process'

import state from '../../../lib/tasks/state'
import xvfb from '../../../lib/exec/xvfb'
import { openDetachedOutput, closeDetachedOutput, removeDetachedOutput, discardDetachedOutput, nameForApp, waitForReadyMessage } from '../../../lib/exec/detached'
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
      // @ts-expect-error - importActual returns unknown, so .default is untyped
      ...actual.default,
      osInfo: vi.fn(),
    },
  }
})

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
      ...actual.default,
      platform: vi.fn(),
      arch: vi.fn(),
    },
  }
})

// `getRealArch()` falls through to the `arch` package, which reports the real
// machine, so pin it alongside the mocked `os.arch()`
vi.mock('arch', () => ({ default: () => 'x64' }))

vi.mock('readline', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
      ...actual.default,
      createInterface: vi.fn(),
    },
  }
})

vi.mock('process', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error - importActual returns unknown, which cannot be spread
    ...actual,
    stdin: {
      // @ts-expect-error - importActual returns unknown, so .stdin is untyped
      ...actual.stdin,
      on: vi.fn(),
      emit: vi.fn(),
      pipe: vi.fn(),
      setRawMode: vi.fn(),
    },
    stdout: vi.fn(),
    stderr: {
      // @ts-expect-error - importActual returns unknown, so .stderr is untyped
      ...actual.stderr,
      write: vi.fn(),
    },
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
      ...actual.default,
      stdin: {
        // @ts-expect-error - importActual returns unknown, so .default is untyped
        ...actual.default.stdin,
        on: vi.fn(),
        emit: vi.fn(),
        pipe: vi.fn(),
        setRawMode: vi.fn(),
      },
      stdout: vi.fn(),
      stderr: {
        // @ts-expect-error - importActual returns unknown, so .default is untyped
        ...actual.default.stderr,
        write: vi.fn(),
      },
      once: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      kill: vi.fn(),
      listenerCount: vi.fn(() => 0),
    },
  }
})

vi.mock('child_process', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
      ...actual.default,
      spawn: vi.fn(),
    },
  }
})

vi.mock('tty', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
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
      // @ts-expect-error - importActual returns unknown, so .default is untyped
      ...actual.default,
      start: vi.fn(),
      stop: vi.fn(),
      release: vi.fn(),
      isNeeded: vi.fn(),
    },
  }
})

vi.mock('../../../lib/exec/detached', async (importActual) => {
  const actual: any = await importActual()

  return {
    openDetachedOutput: vi.fn(),
    closeDetachedOutput: vi.fn(),
    removeDetachedOutput: vi.fn(),
    discardDetachedOutput: vi.fn(),
    nameForApp: vi.fn(),
    signalExitCode: actual.signalExitCode,
    waitForReadyMessage: vi.fn(),
  }
})

vi.mock('../../../lib/tasks/state', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
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
      // @ts-expect-error - importActual returns unknown, so .default is untyped
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
    vi.mocked(xvfb.stop).mockResolvedValue(null)
    vi.mocked(xvfb.isNeeded).mockReturnValue(false)
    vi.mocked(state.getBinaryDir).mockReturnValue(defaultBinaryDir)
    vi.mocked(state.getPathToExecutable).mockImplementation((binaryDir) => {
      if (binaryDir === defaultBinaryDir) {
        return '/path/to/cypress'
      }

      return path.join(binaryDir, 'cypress')
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
      const startPromise = start('--foo')

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

      const startPromise = start('--foo')

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

      const startPromise = start('--foo', { dev: true })

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

      const startPromise = start('--foo', { dev: true })

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

    it('decides on xvfb from the env the child is spawned with', async () => {
      vi.stubEnv('ELECTRON_RUN_AS_NODE', '1')

      const env = { PATH: '/bin' }
      const startPromise = start('--foo', { env })

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      expect(xvfb.isNeeded).toHaveBeenCalledWith(env)
    })

    it('falls back to process.env for the xvfb decision', async () => {
      const startPromise = start('--foo')

      await vi.waitFor(() => expect(spawnedProcess.on).toHaveBeenCalledWith('close', expect.any(Function)))
      spawnedProcess.emit('close', 0)

      await startPromise

      expect(xvfb.isNeeded).toHaveBeenCalledWith(process.env)
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

      it('retries with xvfb if electron reports a missing X server', async () => {
        // mock display missing
        spawnedProcess.stderr.on.mockImplementation((event, callback) => {
          if (event === 'data') {
            callback('[some noise here] Missing X server or $DISPLAY')
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
      const output = { outPath: '/tmp/cypress-open.out', errPath: '/tmp/cypress-open.err', outFd: 11, errFd: 12 }

      const resolveWith = (result: { ready: boolean, code: number }) => {
        vi.mocked(waitForReadyMessage).mockResolvedValue(result)
      }

      beforeEach(() => {
        vi.mocked(openDetachedOutput).mockResolvedValue(output)
        vi.mocked(closeDetachedOutput).mockResolvedValue(undefined)
        vi.mocked(removeDetachedOutput).mockResolvedValue(undefined)
        vi.mocked(discardDetachedOutput).mockResolvedValue(undefined)
        vi.mocked(nameForApp).mockImplementation(async (named) => named)
        stdout.write = vi.fn()
      })

      it('reports the output files under the names that carry the app pid', async () => {
        spawnedProcess.pid = 4321
        resolveWith({ ready: true, code: 0 })
        vi.mocked(nameForApp).mockResolvedValue({ ...output, outPath: '/tmp/cypress-open-app4321.out', errPath: '/tmp/cypress-open-app4321.err' })

        await start([], { detached: true })

        expect(nameForApp).toHaveBeenCalledWith(output, 4321)
        expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining('/tmp/cypress-open-app4321.out'))
        expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining('/tmp/cypress-open-app4321.err'))
      })

      it('signals the process group of the app, so the processes it started stop with it', async () => {
        spawnedProcess.pid = 4321
        vi.mocked(process.listenerCount).mockReturnValue(1)

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          ;(handler as () => void)()

          return { ready: false, code: 137 }
        })

        await start([], { detached: true })

        expect(process.kill).toHaveBeenNthCalledWith(1, -4321, 'SIGINT')
        expect(process.kill).toHaveBeenNthCalledWith(2, -4321, 'SIGKILL')
        expect(spawnedProcess.kill).not.toHaveBeenCalled()
      })

      it('kills the process tree of the app on Windows', async () => {
        spawnedProcess.pid = 4321
        vi.mocked(os.platform).mockReturnValue('win32')
        vi.mocked(process.listenerCount).mockReturnValue(1)

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return { ready: false, code: 130 }
        })

        await start([], { detached: true })
        await flushPromises()

        expect(treeKill).toHaveBeenCalledWith(4321, 'SIGINT', expect.any(Function))
        expect(spawnedProcess.kill).not.toHaveBeenCalled()
      })

      it('signals only the app on Windows when taskkill fails', async () => {
        spawnedProcess.pid = 4321
        vi.mocked(os.platform).mockReturnValue('win32')
        vi.mocked(process.listenerCount).mockReturnValue(1)
        vi.mocked(treeKill).mockImplementation(((_pid: number, _signal: string, callback: (err?: Error) => void) => {
          callback(new Error('Access is denied.'))
        }) as any)

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return { ready: false, code: 130 }
        })

        await start([], { detached: true })
        await vi.waitFor(() => expect(spawnedProcess.kill).toHaveBeenCalledWith('SIGINT'))
      })

      it('re-raises the signal on a host with no handler of its own even when the launch then fails', async () => {
        vi.mocked(process.listenerCount).mockReturnValue(0)

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          throw new Error('read failed')
        })

        await expect(start([], { detached: true })).rejects.toThrow('read failed')
        expect(process.kill).toHaveBeenCalledWith(process.pid, 'SIGINT')
      })

      it('signals only the app on Windows when its process tree cannot be killed', async () => {
        spawnedProcess.pid = 4321
        vi.mocked(os.platform).mockReturnValue('win32')
        vi.mocked(process.listenerCount).mockReturnValue(1)
        vi.mocked(treeKill).mockImplementation(() => {
          throw new Error('taskkill failed')
        })

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return { ready: false, code: 130 }
        })

        await start([], { detached: true })
        await vi.waitFor(() => expect(spawnedProcess.kill).toHaveBeenCalledWith('SIGINT'))
      })

      it('stops the app, and removes its renamed output, when interrupted while the output is renamed', async () => {
        const named = { ...output, outPath: '/tmp/cypress-open-app4321.out', errPath: '/tmp/cypress-open-app4321.err' }

        vi.mocked(process.listenerCount).mockReturnValue(1)
        resolveWith({ ready: true, code: 0 })

        vi.mocked(nameForApp).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return named
        })

        const startPromise = start([], { detached: true })

        await vi.waitFor(() => expect(spawnedProcess.kill).toHaveBeenCalledWith('SIGINT'))
        spawnedProcess.emit('exit', null, 'SIGINT')

        expect(await startPromise).toBe(130)
        expect(spawnedProcess.unref).not.toHaveBeenCalled()
        expect(removeDetachedOutput).toHaveBeenCalledWith(named)
      })

      it('signals only the app when its process group cannot be signalled', async () => {
        spawnedProcess.pid = 4321
        vi.mocked(process.listenerCount).mockReturnValue(1)
        vi.mocked(process.kill).mockImplementation(() => {
          throw Object.assign(new Error('ESRCH'), { code: 'ESRCH' })
        })

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return { ready: false, code: 130 }
        })

        await start([], { detached: true })

        expect(spawnedProcess.kill).toHaveBeenCalledWith('SIGINT')
      })

      it('spawns with file descriptors instead of pipes', async () => {
        resolveWith({ ready: true, code: 0 })

        await start([], { detached: true })

        // @ts-expect-error - mock argument
        const thirdArg = cp.spawn.mock.calls[0][2]

        expect(thirdArg.stdio).toEqual(['ignore', output.outFd, output.errFd])
        expect(waitForReadyMessage).toHaveBeenCalledWith(output.outPath, output.errPath, spawnedProcess, expect.any(Function))
      })

      it('retries inside Xvfb with the same arguments, asking for the ready message once', async () => {
        vi.stubEnv('DISPLAY', 'test-display')
        vi.mocked(os.platform).mockReturnValue('linux')

        vi.mocked(waitForReadyMessage)
        .mockImplementationOnce(async (_out, _err, _child, onStderr) => {
          onStderr?.(Buffer.from('[some noise here] Gtk: cannot open display: 987'))

          return { ready: false, code: 1 }
        })
        .mockResolvedValueOnce({ ready: true, code: 0 })

        const code = await start([], { detached: true })

        expect(code).toBe(0)
        expect(cp.spawn).toHaveBeenCalledTimes(2)
        expect(xvfb.start).toHaveBeenCalledOnce()

        // @ts-expect-error - mock argument
        const [[, firstArgs], [, secondArgs]] = cp.spawn.mock.calls

        expect(secondArgs).toEqual(firstArgs)
        expect(secondArgs.filter((arg: string) => arg === '--emit-when-ready')).toHaveLength(1)
      })

      it('settles from the wait on its output, not from the child exiting first', async () => {
        resolveWith({ ready: false, code: 1 })

        await start([], { detached: true })

        expect(spawnedProcess.listenerCount('exit')).toBe(0)
        expect(spawnedProcess.listenerCount('close')).toBe(0)
      })

      it('sends what the app printed to stderr through the same filter as piped stderr', async () => {
        vi.mocked(waitForReadyMessage).mockImplementation(async (_outPath, _errPath, _child, onStderr) => {
          onStderr?.(Buffer.from('from the app'))

          return { ready: true, code: 0 }
        })

        const write = vi.spyOn(stderr, 'write').mockImplementation(() => true)

        await start([], { detached: true })
        await new Promise((resolve) => setImmediate(resolve))

        expect(stderrFilter).toHaveBeenCalled()
        expect(write.mock.calls.map(([chunk]) => chunk.toString()).join('')).toContain('from the app')
      })

      it('rejects, without spawning, when the output files cannot be opened', async () => {
        vi.mocked(openDetachedOutput).mockRejectedValue(new Error('EACCES: tmp is not writable'))

        await expect(start([], { detached: true })).rejects.toThrow('EACCES')
        expect(cp.spawn).not.toHaveBeenCalled()
      })

      it('closes and removes the output files when spawning throws', async () => {
        vi.mocked(cp.spawn).mockImplementation(() => {
          throw new Error('spawn failed')
        })

        await expect(start([], { detached: true })).rejects.toThrow('spawn failed')
        expect(discardDetachedOutput).toHaveBeenCalledWith(output)
      })

      it('passes --emit-when-ready to the Cypress process', async () => {
        resolveWith({ ready: true, code: 0 })

        await start([], { detached: true })

        // @ts-expect-error - vitest mock
        const spawnArgs = cp.spawn.mock.calls[0][1]

        expect(spawnArgs).toContain('--emit-when-ready')
      })

      it('closes the descriptors, unrefs and reports the output location once ready', async () => {
        resolveWith({ ready: true, code: 0 })

        const code = await start([], { detached: true })

        expect(code).toBe(0)
        expect(closeDetachedOutput).toHaveBeenCalledWith(output)
        expect(spawnedProcess.unref).toHaveBeenCalledOnce()
        expect(vi.mocked(closeDetachedOutput).mock.invocationCallOrder[0])
        .toBeLessThan(spawnedProcess.unref.mock.invocationCallOrder[0])

        expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining(output.outPath))
        expect(stdout.write).toHaveBeenCalledWith(expect.stringContaining(output.errPath))
        expect(removeDetachedOutput).not.toHaveBeenCalled()
      })

      it('does not wait for the child to close or read the terminal', async () => {
        resolveWith({ ready: true, code: 0 })

        await start([], { detached: true })

        expect(readline.createInterface).not.toHaveBeenCalled()
      })

      it('listens for an interrupt only until the app is handed off', async () => {
        resolveWith({ ready: true, code: 0 })

        await start([], { detached: true })

        const signals = vi.mocked(process.on).mock.calls.map(([signal]) => signal)

        expect(signals).toEqual(['SIGINT', 'SIGTERM'])

        for (const [signal, handler] of vi.mocked(process.on).mock.calls) {
          expect(process.off).toHaveBeenCalledWith(signal, handler)
        }
      })

      it('does not start the app when interrupted while its output files are opened', async () => {
        vi.mocked(openDetachedOutput).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return output
        })

        const code = await start([], { detached: true })

        expect(cp.spawn).not.toHaveBeenCalled()
        expect(discardDetachedOutput).toHaveBeenCalledWith(output)
        expect(code).toBe(130)
      })

      it('stops the app, rather than leaving it running unseen, when interrupted before it is ready', async () => {
        spawnedProcess.kill = vi.fn()

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return { ready: false, code: 130 }
        })

        const code = await start([], { detached: true })

        expect(spawnedProcess.kill).toHaveBeenCalledWith('SIGINT')
        expect(code).toBe(130)
        expect(spawnedProcess.unref).not.toHaveBeenCalled()
      })

      it('re-raises the signal on a host that has no handler of its own, so Ctrl-C still ends it', async () => {
        spawnedProcess.kill = vi.fn()
        vi.mocked(process.listenerCount).mockReturnValue(0)

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return { ready: false, code: 130 }
        })

        await start([], { detached: true })

        expect(process.kill).toHaveBeenCalledWith(process.pid, 'SIGINT')
      })

      it('reports an interrupted run as interrupted even when the app quit cleanly', async () => {
        spawnedProcess.kill = vi.fn()
        vi.mocked(process.listenerCount).mockReturnValue(1)

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return { ready: false, code: 0 }
        })

        expect(await start([], { detached: true })).toBe(130)
      })

      it('removes the output files after an interrupt', async () => {
        spawnedProcess.kill = vi.fn()

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return { ready: false, code: 130 }
        })

        await start([], { detached: true })

        expect(removeDetachedOutput).toHaveBeenCalledWith(output)
      })

      it('stops the app, rather than handing it off, when interrupted while its output files are closed', async () => {
        spawnedProcess.kill = vi.fn()
        vi.mocked(process.listenerCount).mockReturnValue(1)
        resolveWith({ ready: true, code: 0 })

        vi.mocked(closeDetachedOutput).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()
        })

        const startPromise = start([], { detached: true })

        await vi.waitFor(() => expect(spawnedProcess.kill).toHaveBeenCalledWith('SIGINT'))
        spawnedProcess.emit('exit', null, 'SIGINT')

        expect(await startPromise).toBe(130)
        expect(spawnedProcess.unref).not.toHaveBeenCalled()
        expect(removeDetachedOutput).toHaveBeenCalledWith(output)
      })

      describe('an interrupt that arrives together with the ready message', () => {
        beforeEach(() => {
          spawnedProcess.kill = vi.fn()
          vi.mocked(process.listenerCount).mockReturnValue(1)

          vi.mocked(waitForReadyMessage).mockImplementation(async () => {
            const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

            ;(handler as () => void)()

            return { ready: true, code: 0 }
          })
        })

        it('does not hand the app off, and waits for it to exit before cleaning up', async () => {
          const startPromise = start([], { detached: true })

          await vi.waitFor(() => expect(spawnedProcess.kill).toHaveBeenCalledWith('SIGINT'))
          await flushPromises()

          expect(removeDetachedOutput).not.toHaveBeenCalled()

          spawnedProcess.emit('exit', null, 'SIGINT')

          expect(await startPromise).toBe(130)
          expect(removeDetachedOutput).toHaveBeenCalledWith(output)
          expect(nameForApp).not.toHaveBeenCalled()
          expect(spawnedProcess.unref).not.toHaveBeenCalled()
          expect(stdout.write).not.toHaveBeenCalled()
        })

        it('kills the app at once when interrupted again while it is shutting down', async () => {
          const startPromise = start([], { detached: true })

          await vi.waitFor(() => expect(spawnedProcess.kill).toHaveBeenCalledWith('SIGINT'))
          await flushPromises()

          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          expect(spawnedProcess.kill).toHaveBeenLastCalledWith('SIGKILL')
          expect(process.off).not.toHaveBeenCalled()

          spawnedProcess.emit('exit', null, 'SIGKILL')
          await startPromise
        })

        it('kills an app that ignores the signal rather than waiting for it for ever', async () => {
          vi.useFakeTimers()

          try {
            const startPromise = start([], { detached: true })

            await vi.advanceTimersByTimeAsync(100)
            await vi.advanceTimersByTimeAsync(6000)

            expect(spawnedProcess.kill).toHaveBeenLastCalledWith('SIGKILL')
            expect(await startPromise).toBe(130)
          } finally {
            vi.useRealTimers()
          }
        })
      })

      it('does not retry in Xvfb an app that was interrupted while it died of a missing display', async () => {
        vi.stubEnv('DISPLAY', 'test-display')
        vi.mocked(os.platform).mockReturnValue('linux')
        spawnedProcess.kill = vi.fn()

        vi.mocked(waitForReadyMessage).mockImplementationOnce(async (_out, _err, _child, onStderr) => {
          onStderr?.(Buffer.from('[some noise here] Gtk: cannot open display: 987'))

          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return { ready: false, code: 130 }
        })

        vi.mocked(process.listenerCount).mockReturnValue(1)

        expect(await start([], { detached: true })).toBe(130)
        expect(cp.spawn).toHaveBeenCalledTimes(1)
        expect(xvfb.start).not.toHaveBeenCalled()
      })

      it('leaves the signal to a host that handles it itself', async () => {
        spawnedProcess.kill = vi.fn()
        vi.mocked(process.listenerCount).mockReturnValue(1)

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          return { ready: false, code: 130 }
        })

        await start([], { detached: true })

        expect(process.kill).not.toHaveBeenCalled()
      })

      it('does not raise a signal when nothing interrupted the wait', async () => {
        resolveWith({ ready: true, code: 0 })

        await start([], { detached: true })

        expect(process.kill).not.toHaveBeenCalled()
      })

      it('kills an app that ignored the first interrupt when interrupted again', async () => {
        spawnedProcess.kill = vi.fn()

        vi.mocked(waitForReadyMessage).mockImplementation(async () => {
          const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

          ;(handler as () => void)()

          ;(handler as () => void)()

          return { ready: false, code: 137 }
        })

        await start([], { detached: true })

        expect(spawnedProcess.kill).toHaveBeenNthCalledWith(1, 'SIGINT')
        expect(spawnedProcess.kill).toHaveBeenNthCalledWith(2, 'SIGKILL')
      })

      it('stops listening, cleans up and rejects when waiting for the app fails', async () => {
        spawnedProcess.kill = vi.fn()
        vi.mocked(waitForReadyMessage).mockRejectedValue(new Error('read failed'))

        await expect(start([], { detached: true })).rejects.toThrow('read failed')

        expect(spawnedProcess.kill).toHaveBeenCalled()
        expect(removeDetachedOutput).toHaveBeenCalled()
        expect(closeDetachedOutput).toHaveBeenCalled()

        for (const [signal, handler] of vi.mocked(process.on).mock.calls) {
          expect(process.off).toHaveBeenCalledWith(signal, handler)
        }
      })

      it('resolves with the exit code and does not unref if the child exits before ready', async () => {
        resolveWith({ ready: false, code: 1 })

        const code = await start([], { detached: true })

        expect(code).toBe(1)
        expect(spawnedProcess.unref).not.toHaveBeenCalled()
        expect(closeDetachedOutput).toHaveBeenCalledWith(output)
        expect(removeDetachedOutput).toHaveBeenCalledWith(output)
      })

      describe('with xvfb', () => {
        beforeEach(() => {
          vi.mocked(xvfb.isNeeded).mockReturnValue(true)
        })

        it('leaves xvfb running after the app is ready', async () => {
          resolveWith({ ready: true, code: 0 })

          await start([], { detached: true })

          expect(xvfb.start).toHaveBeenCalledOnce()
          expect(xvfb.start).toHaveBeenCalledWith({ detached: true })
          expect(xvfb.stop).not.toHaveBeenCalled()
        })

        it('stops xvfb before re-raising an interrupt, so the display is not left behind', async () => {
          vi.mocked(process.listenerCount).mockReturnValue(0)

          const order: string[] = []

          vi.mocked(xvfb.stop).mockImplementation(async () => {
            order.push('xvfb.stop')

            return null
          })

          vi.mocked(process.kill).mockImplementation((() => {
            order.push('process.kill')

            return true
          }) as any)

          vi.mocked(waitForReadyMessage).mockImplementation(async () => {
            const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGTERM')!

            ;(handler as () => void)()

            return { ready: false, code: 143 }
          })

          spawnedProcess.kill = vi.fn()

          await start([], { detached: true })

          expect(order).toEqual(['xvfb.stop', 'process.kill'])
        })

        const interruptWhileXvfbStarts = (finish: () => Promise<null>) => {
          vi.mocked(xvfb.start).mockImplementation(async () => {
            const [, handler] = vi.mocked(process.on).mock.calls.find(([signal]) => signal === 'SIGINT')!

            ;(handler as () => void)()

            // The interrupt does not wait for Xvfb to finish starting
            expect(xvfb.stop).toHaveBeenCalledOnce()

            return finish()
          })
        }

        it('stops a starting xvfb at once when interrupted, and reports the interrupt rather than the xvfb failure', async () => {
          vi.mocked(process.listenerCount).mockReturnValue(0)
          interruptWhileXvfbStarts(() => Promise.reject(new Error('Xvfb exited with a non zero exit code.')))

          const code = await start([], { detached: true })

          expect(cp.spawn).not.toHaveBeenCalled()
          expect(code).toBe(130)
          expect(process.kill).toHaveBeenCalledWith(process.pid, 'SIGINT')
        })

        it('does not start the app when xvfb finished starting before the interrupt stopped it', async () => {
          interruptWhileXvfbStarts(async () => null)

          const code = await start([], { detached: true })

          expect(cp.spawn).not.toHaveBeenCalled()
          expect(openDetachedOutput).not.toHaveBeenCalled()
          expect(code).toBe(130)
        })

        it('still reports an xvfb that fails to start when nothing interrupted it', async () => {
          vi.mocked(xvfb.start).mockRejectedValue(new Error('Xvfb exited with a non zero exit code.'))

          await expect(start([], { detached: true })).rejects.toThrow('non zero exit code')
        })

        it('releases xvfb, rather than stopping it, once the app is handed off', async () => {
          resolveWith({ ready: true, code: 0 })

          await start([], { detached: true })

          expect(xvfb.release).toHaveBeenCalledOnce()
          expect(xvfb.stop).not.toHaveBeenCalled()
        })

        it('keeps listening for an interrupt until xvfb is stopped', async () => {
          resolveWith({ ready: false, code: 1 })

          const order: string[] = []

          vi.mocked(xvfb.start).mockImplementation(async () => {
            order.push('xvfb.start')

            return null
          })

          vi.mocked(xvfb.stop).mockImplementation(async () => {
            order.push('xvfb.stop')

            return null
          })

          vi.mocked(process.on).mockImplementation(((signal: string) => {
            order.push(`on ${signal}`)

            return process
          }) as any)

          vi.mocked(process.off).mockImplementation(((signal: string) => {
            order.push(`off ${signal}`)

            return process
          }) as any)

          await start([], { detached: true })

          expect(order).toEqual(['on SIGINT', 'on SIGTERM', 'xvfb.start', 'xvfb.stop', 'off SIGINT', 'off SIGTERM'])
        })

        it('stops xvfb if the app fails before ready', async () => {
          resolveWith({ ready: false, code: 1 })

          await start([], { detached: true })

          expect(xvfb.stop).toHaveBeenCalledOnce()
        })
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

          return stdinEmitter.emit(event, ...args)
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
