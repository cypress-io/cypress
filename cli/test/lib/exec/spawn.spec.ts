import { vi, describe, it, beforeEach, expect } from 'vitest'
import cp from 'child_process'
import os from 'os'
import tty from 'tty'
import path from 'path'
import treeKill from 'tree-kill'
import si from 'systeminformation'
import { EventEmitter as EE } from 'events'
import readline from 'readline'
import createDebug from 'debug'
import { stdin, stdout, stderr } from 'process'

import state from '../../../lib/tasks/state'
import xvfb from '../../../lib/exec/xvfb'
import spawn from '../../../lib/exec/spawn'
import { needsSandbox } from '../../../lib/tasks/verify'
import util from '../../../lib/util'

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
    stdin: {
      // @ts-expect-error
      ...actual.stdin,
      pipe: vi.fn(),
      on: vi.fn(),
      emit: vi.fn(),
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
        pipe: vi.fn(),
        on: vi.fn(),
      },
      stdout: vi.fn(),
      stderr: {
        // @ts-expect-error
        ...actual.default.stderr,
        write: vi.fn(),
      },
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
  let mockReadlineEE: any

  beforeEach(function () {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('DISPLAY', undefined)

    // @ts-expect-error - mockReturnValue
    os.platform.mockReturnValue('darwin')
    // @ts-expect-error - mockReturnValue
    os.arch.mockReturnValue('x64')
    // @ts-expect-error mockResolvedValue
    si.osInfo.mockResolvedValue({
      distro: 'Foo',
      release: 'OsVersion',
    })

    spawnedProcess = new EE()
    spawnedProcess.unref = vi.fn().mockReturnValue(undefined)
    spawnedProcess.stdin = {
      on: vi.fn().mockReturnValue(undefined),
      pipe: vi.fn().mockReturnValue(undefined),
    }

    spawnedProcess.stdout = {
      on: vi.fn().mockReturnValue(undefined),
      pipe: vi.fn().mockReturnValue(undefined),
    }

    spawnedProcess.stderr = {
      pipe: vi.fn().mockReturnValue(undefined),
      on: vi.fn().mockReturnValue(undefined),
    }

    spawnedProcess.kill = vi.fn()

    mockReadlineEE = new EE()

    // @ts-expect-error - mockReturnValue
    readline.createInterface.mockReturnValue(mockReadlineEE)
    // @ts-expect-error - mockReturnValue
    cp.spawn.mockReturnValue(spawnedProcess)
    // @ts-expect-error - mockReturnValue
    xvfb.start.mockResolvedValue(undefined)
    // @ts-expect-error - mockReturnValue
    xvfb.stop.mockResolvedValue(undefined)
    // @ts-expect-error - mockReturnValue
    xvfb.isNeeded.mockReturnValue(false)
    // @ts-expect-error - mockReturnValue
    state.getBinaryDir.mockReturnValue(defaultBinaryDir)
    // @ts-expect-error - mockImplementation
    state.getPathToExecutable.mockImplementation((args) => {
      if (args === '/default/binary/dir') {
        return '/path/to/cypress'
      }
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
      // @ts-expect-error - mockReturnValue
      needsSandbox.mockReturnValue(false)

      // start the process
      const startPromise = spawn.start('--foo', { foo: 'bar' })

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
      // @ts-expect-error - mockReturnValue
      needsSandbox.mockReturnValue(true)

      const startPromise = spawn.start('--foo', { foo: 'bar' })

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
      // @ts-expect-error - mockReturnValue
      needsSandbox.mockReturnValue(false)

      const startPromise = spawn.start('--foo', { dev: true, foo: 'bar' })

      spawnedProcess.emit('close', 0)

      await startPromise

      const p = path.resolve('..', 'scripts', 'start.js')

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
      // @ts-expect-error - mockReturnValue
      needsSandbox.mockReturnValue(true)

      const startPromise = spawn.start('--foo', { dev: true, foo: 'bar' })

      spawnedProcess.emit('close', 0)

      await startPromise

      const p = path.resolve('..', 'scripts', 'start.js')

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
      // @ts-expect-error - mockReturnValue
      xvfb.isNeeded.mockReturnValue(true)

      const startPromise = spawn.start('--foo')

      await flushPromises()

      spawnedProcess.emit('close', 0)

      await startPromise

      expect(xvfb.start).toBeCalled()
    })

    describe('closes', function () {
      ['close', 'exit'].forEach((event) => {
        it(`if '${event}' event fired`, async () => {
          const startPromise = spawn.start('--foo')

          spawnedProcess.emit(event, 0)

          const code = await startPromise

          expect(code).toEqual(0)
        })
      })

      it('if exit event fired and close event fired', async () => {
        const startPromise = spawn.start('--foo')

        spawnedProcess.emit('exit', 0)
        spawnedProcess.emit('close', 0)

        const code = await startPromise

        expect(code).toEqual(0)
      })
    })

    describe('detects kill signal', async () => {
      it('exits with error on SIGKILL', async () => {
        try {
          const startPromise = spawn.start('--foo')

          spawnedProcess.emit('exit', null, 'SIGKILL')

          await startPromise

          throw new Error('should have hit error handler but did not')
        } catch (e) {
          expect(e.message).toMatch(/SIGKILL/)
          expect(e.message).toMatchSnapshot()
        }
      })
    })

    it('does not start xvfb when its not needed', async () => {
      const startPromise = spawn.start('--foo')

      await flushPromises()

      spawnedProcess.emit('close', 0)

      await startPromise

      expect(xvfb.start).not.toBeCalled()
    })

    it('stops xvfb when spawn closes', async () => {
      // @ts-expect-error - mockReturnValue
      xvfb.isNeeded.mockReturnValue(true)

      const startPromise = spawn.start('--foo')

      await flushPromises()

      spawnedProcess.emit('close', 0)

      await startPromise

      expect(xvfb.stop).toBeCalled()
    })

    it('resolves with spawned close code in the message', async () => {
      const startPromise = spawn.start('--foo')

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

        // @ts-expect-error - mockReturnValue
        os.platform.mockReturnValue('linux')

        const startPromise = spawn.start('--foo')

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

      const startPromise = spawn.start('--foo')

      spawnedProcess.emit('error', new Error(msg))

      try {
        await startPromise

        throw new Error('should have hit error handler but did not')
      } catch (e) {
        debug('error message', e.message)
        expect(e.message).toMatch(msg)
      }
    })

    it('unrefs if options.detached is true', async () => {
      const startPromise = spawn.start(null, { detached: true })

      spawnedProcess.emit('close', 0)

      await startPromise

      expect(spawnedProcess.unref).toHaveBeenCalledOnce()
    })

    it('does not unref by default', async () => {
      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = spawn.start()

      spawnedProcess.emit('close', 0)

      await startPromise

      expect(spawnedProcess.unref).not.toHaveBeenCalled()
    })

    it('sets process.env to options.env', async () => {
      vi.stubEnv('FOO', 'bar')

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = spawn.start()

      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.env.FOO).toEqual('bar')
    })

    it('forces colors and streams when supported', async () => {
      // @ts-expect-error - mockReturnValue
      util.supportsColor.mockReturnValue(true)
      // @ts-expect-error - mockReturnValue
      tty.isatty.mockReturnValue(true)

      const startPromise = spawn.start([], { env: {} })

      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.env).toMatchSnapshot()
    })

    it('sets windowsHide:false property in windows', async () => {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('win32')

      const startPromise = spawn.start([], { env: {} })

      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.windowsHide).toEqual(false)
    })

    it('propagates treeKill if SIGINT is detected in windows console', async () => {
      spawnedProcess.pid = 7
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('win32')

      const startPromise = spawn.start([], { env: {} })

      spawnedProcess.emit('close', 0)

      await startPromise

      mockReadlineEE.emit('SIGINT')
      // since the import of tree-kill is async inside spawn, we need to wait for it to be imported and called
      await flushPromises()

      expect(treeKill).toHaveBeenCalledWith(7, 'SIGINT')
    })

    it('does not set windowsHide property when in darwin', async () => {
      const startPromise = spawn.start([], { env: {} })

      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.windowsHide).toBeUndefined()
    })

    it('does not force colors and streams when not supported', async () => {
      // @ts-expect-error - mockReturnValue
      util.supportsColor.mockReturnValue(false)
      // @ts-expect-error - mockReturnValue
      tty.isatty.mockReturnValue(false)

      const startPromise = spawn.start([], { env: {} })

      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.env).toMatchSnapshot()
    })

    it('pipes when on win32', async () => {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('win32')

      // @ts-expect-error - mockReturnValue
      xvfb.isNeeded.mockReturnValue(false)

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = spawn.start()

      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.stdio).toEqual('pipe')

      expect(stdin.pipe).toHaveBeenCalledOnce()
      expect(stdin.pipe).toHaveBeenCalledWith(spawnedProcess.stdin)
    })

    it('inherits when on linux and xvfb isn\'t needed', async () => {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('linux')

      // @ts-expect-error - mockReturnValue
      xvfb.isNeeded.mockReturnValue(false)

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = spawn.start()

      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.stdio).toEqual('inherit')
    })

    it('uses [inherit, inherit, pipe] when linux and xvfb is needed', async () => {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('linux')

      // @ts-expect-error - mockReturnValue
      xvfb.isNeeded.mockReturnValue(true)

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = spawn.start()

      await flushPromises()

      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.stdio).toEqual(['inherit', 'inherit', 'pipe'])
    })

    it('uses [inherit, inherit, pipe] on darwin', async () => {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('darwin')

      // @ts-expect-error - mockReturnValue
      xvfb.isNeeded.mockReturnValue(false)

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = spawn.start()

      await flushPromises()

      spawnedProcess.emit('close', 0)

      await startPromise

      // @ts-expect-error - mock argument
      const thirdArg = cp.spawn.mock.calls[0][2]

      expect(thirdArg.stdio).to.deep.eq([
        'inherit', 'inherit', 'pipe',
      ])
    })

    it('writes everything on win32', async () => {
      // @ts-expect-error - mockReturnValue
      os.platform.mockReturnValue('win32')

      const buf1 = Buffer.from('asdf')

      // mock display missing
      spawnedProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(buf1)
        }
      })

      // @ts-expect-error - invalid number of arguments for given type
      const startPromise = spawn.start()

      spawnedProcess.emit('close', 0)

      await startPromise

      // validates the child process stderr event handler was called
      expect(stderr.write).toHaveBeenCalledWith(buf1)
      expect(stdin.pipe).toHaveBeenCalledExactlyOnceWith(spawnedProcess.stdin)
      expect(spawnedProcess.stdout.pipe).toHaveBeenCalledExactlyOnceWith(stdout)
    })

    // https://github.com/cypress-io/cypress/issues/1841
    // https://github.com/cypress-io/cypress/issues/5241
    const errCodes = ['EPIPE', 'ENOTCONN']

    errCodes.forEach((errCode) => {
      beforeEach(() => {
        // create an EventEmitter and bind it to process.stdin
        const stdinEE = new EE()

        // @ts-expect-error - mockImplementation
        stdin.emit.mockImplementation((event, ...args) => {
          stdinEE.emit(event, ...args)
        })

        // @ts-expect-error - mockImplementation
        stdin.on.mockImplementation((event, callback) => {
          return stdinEE.on(event, callback)
        })
      })

      it(`catches process.stdin errors and returns when code=${errCode}`, async () => {
        expect(() => {
          // kick off the mock process
          // @ts-expect-error - invalid number of arguments for given type
          spawn.start()

          const err: any = new Error()

          err.code = errCode

          return stdin.emit('error', err)
        }).not.toThrow()
      })
    })

    it('throws process.stdin errors code!=EPIPE', function () {
      expect(() => {
        // kick off the mock process
        // @ts-expect-error - invalid number of arguments for given type
        spawn.start()

        const err: any = new Error('wattttt')

        err.code = 'FAILWHALE'

        return stdin.emit('error', err)
      }).toThrow(/wattttt/)
    })
  })
})
