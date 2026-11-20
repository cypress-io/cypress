import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import os from 'os'
import path from 'path'
import { EventEmitter } from 'events'
import cp from 'child_process'
import fs from 'fs-extra'
import { stdout, stderr } from 'process'
import {
  waitForReadyMessage,
  openDetachedOutput,
  closeDetachedOutput,
  nameForApp,
  pruneStaleDetachedOutput,
  CYPRESS_OPEN_READY_MESSAGE,
  POLL_INTERVAL_MS,
} from '../../../lib/exec/detached'

describe('lib/exec/detached', function () {
  let dir: string
  let outPath: string
  let errPath: string
  let child: EventEmitter
  let forwardedOut: string
  let forwardedErr: string

  // Longer than the poll interval so at least one poll runs in between
  const pause = () => new Promise((resolve) => setTimeout(resolve, 600))

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cypress-detached-spec-'))
    outPath = path.join(dir, 'open.out')
    errPath = path.join(dir, 'open.err')
    await fs.writeFile(outPath, '')
    await fs.writeFile(errPath, '')

    child = new EventEmitter()
    forwardedOut = ''
    forwardedErr = ''

    vi.spyOn(stdout, 'write').mockImplementation((chunk: any) => {
      forwardedOut += chunk.toString()

      return true
    })

    vi.spyOn(stderr, 'write').mockImplementation((chunk: any) => {
      forwardedErr += chunk.toString()

      return true
    })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.remove(dir)
  })

  describe('pruneStaleDetachedOutput', () => {
    it('removes output files older than a week and keeps recent ones and other files', async () => {
      vi.spyOn(os, 'tmpdir').mockReturnValue(dir)

      const stale = path.join(dir, 'cypress-open-111-1000.out')
      const recent = path.join(dir, 'cypress-open-222-2000.err')
      const other = path.join(dir, 'unrelated.out')

      await Promise.all([stale, recent, other].map((file) => fs.writeFile(file, 'x')))

      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)

      await fs.utimes(stale, eightDaysAgo, eightDaysAgo)
      await fs.utimes(other, eightDaysAgo, eightDaysAgo)

      await pruneStaleDetachedOutput()

      expect(await fs.pathExists(stale)).toBe(false)
      expect(await fs.pathExists(recent)).toBe(true)
      expect(await fs.pathExists(other)).toBe(true)
    })

    it('keeps old output of an app that is still running, and removes that of one that is not', async () => {
      vi.spyOn(os, 'tmpdir').mockReturnValue(dir)

      // Above the highest pid any supported platform hands out
      const deadPid = 2 ** 31 - 2
      const running = path.join(dir, `cypress-open-111-1000-app${process.pid}.out`)
      const exited = path.join(dir, `cypress-open-111-1000-app${deadPid}.err`)

      await Promise.all([running, exited].map((file) => fs.writeFile(file, 'x')))

      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)

      await Promise.all([running, exited].map((file) => fs.utimes(file, eightDaysAgo, eightDaysAgo)))

      await pruneStaleDetachedOutput()

      expect(await fs.pathExists(running)).toBe(true)
      expect(await fs.pathExists(exited)).toBe(false)
    })

    it('does not throw when the directory cannot be read', async () => {
      vi.spyOn(os, 'tmpdir').mockReturnValue(path.join(dir, 'missing'))

      await expect(pruneStaleDetachedOutput()).resolves.toBeUndefined()
    })
  })

  describe('nameForApp', () => {
    const output = () => ({ outPath, errPath, outFd: -1, errFd: -1 })

    it('renames the output files to carry the app pid', async () => {
      const named = await nameForApp(output(), 4321)

      expect(named.outPath).toBe(path.join(dir, 'open-app4321.out'))
      expect(named.errPath).toBe(path.join(dir, 'open-app4321.err'))
      expect(await fs.pathExists(named.outPath)).toBe(true)
      expect(await fs.pathExists(outPath)).toBe(false)
    })

    it('keeps the name of a file that cannot be renamed', async () => {
      await fs.remove(errPath)

      const named = await nameForApp(output(), 4321)

      expect(named.outPath).toBe(path.join(dir, 'open-app4321.out'))
      expect(named.errPath).toBe(errPath)
    })

    it('leaves the names alone without a pid', async () => {
      expect(await nameForApp(output(), undefined)).toEqual(output())
    })
  })

  describe('openDetachedOutput', () => {
    it('does not use a file that is already there, and takes the next name instead', async () => {
      vi.spyOn(os, 'tmpdir').mockReturnValue(dir)
      vi.spyOn(Date, 'now').mockReturnValue(1700000000000)

      const taken = path.join(dir, `cypress-open-${process.pid}-1700000000000.out`)

      await fs.writeFile(taken, 'planted')

      const opened = await openDetachedOutput()

      await closeDetachedOutput(opened)

      expect(opened.outPath).toBe(path.join(dir, `cypress-open-${process.pid}-1700000000000-1.out`))
      expect(await fs.readFile(taken, 'utf8')).toBe('planted')
    })

    it('takes the next name when only the error file name is taken, and leaves nothing of the first attempt', async () => {
      vi.spyOn(os, 'tmpdir').mockReturnValue(dir)
      vi.spyOn(Date, 'now').mockReturnValue(1700000000003)

      const stem = path.join(dir, `cypress-open-${process.pid}-1700000000003`)

      await fs.writeFile(`${stem}.err`, 'planted')

      const opened = await openDetachedOutput()

      await closeDetachedOutput(opened)

      expect(opened.outPath).toBe(`${stem}-1.out`)
      expect(await fs.pathExists(`${stem}.out`)).toBe(false)
      expect(await fs.readFile(`${stem}.err`, 'utf8')).toBe('planted')
    })

    it('gives up when every name it tries is taken', async () => {
      vi.spyOn(os, 'tmpdir').mockReturnValue(dir)
      vi.spyOn(Date, 'now').mockReturnValue(1700000000002)

      const stem = path.join(dir, `cypress-open-${process.pid}-1700000000002`)

      await Promise.all(['', '-1', '-2', '-3', '-4', '-5'].map((suffix) => fs.writeFile(`${stem}${suffix}.out`, 'planted')))

      await expect(openDetachedOutput()).rejects.toMatchObject({ code: 'EEXIST' })
    })

    it('closes and removes the first file when the second cannot be opened', async () => {
      vi.spyOn(os, 'tmpdir').mockReturnValue(dir)
      vi.spyOn(Date, 'now').mockReturnValue(1700000000001)

      const realOpen = fs.open.bind(fs)
      const opened: number[] = []

      vi.spyOn(fs, 'open').mockImplementation((async (file: string, ...rest: any[]) => {
        if (String(file).endsWith('.err')) {
          throw Object.assign(new Error('EACCES'), { code: 'EACCES' })
        }

        const fd = await (realOpen as any)(file, ...rest)

        opened.push(fd)

        return fd
      }) as any)

      const closeSpy = vi.spyOn(fs, 'close')

      await expect(openDetachedOutput()).rejects.toMatchObject({ code: 'EACCES' })

      expect(closeSpy).toHaveBeenCalledWith(opened[0])
      expect(await fs.pathExists(path.join(dir, `cypress-open-${process.pid}-1700000000001.out`))).toBe(false)
    })

    it('creates output files only the current user can read', async () => {
      vi.spyOn(os, 'tmpdir').mockReturnValue(dir)

      const output = await openDetachedOutput()

      try {
        if (os.platform() !== 'win32') {
          expect((await fs.stat(output.outPath)).mode & 0o777).toBe(0o600)
          expect((await fs.stat(output.errPath)).mode & 0o777).toBe(0o600)
        }
      } finally {
        await closeDetachedOutput(output)
      }
    })
  })

  describe('waitForReadyMessage', () => {
    it('hands what the app printed to stderr to the given function instead of writing it', async () => {
      const chunks: string[] = []
      const result = waitForReadyMessage(outPath, errPath, child as any, (chunk) => chunks.push(chunk.toString()))

      await fs.appendFile(errPath, 'noise\n')
      await pause()
      await fs.appendFile(outPath, `${CYPRESS_OPEN_READY_MESSAGE}\n`)
      await result

      expect(chunks.join('')).toContain('noise')
      expect(forwardedErr).toBe('')
    })

    it('resolves ready and forwards output printed before the sentinel', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      await fs.appendFile(outPath, `starting up\n${CYPRESS_OPEN_READY_MESSAGE}\nlater output\n`)

      await expect(result).resolves.toEqual({ ready: true, code: 0 })
      expect(forwardedOut).toBe('starting up\n')
    })

    it('finds a sentinel that is split across two reads', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      const half = Math.floor(CYPRESS_OPEN_READY_MESSAGE.length / 2)

      await fs.appendFile(outPath, `hello\n${CYPRESS_OPEN_READY_MESSAGE.slice(0, half)}`)
      await pause()

      // the partial sentinel is held back, not printed
      expect(forwardedOut).toBe('hello\n')

      await fs.appendFile(outPath, CYPRESS_OPEN_READY_MESSAGE.slice(half))

      await expect(result).resolves.toEqual({ ready: true, code: 0 })
      expect(forwardedOut).toBe('hello\n')
    })

    it('forwards text that only looked like the start of the sentinel', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      await fs.appendFile(outPath, 'Cypress is')
      await pause()
      await fs.appendFile(outPath, ' starting\n')
      await pause()

      expect(forwardedOut).toBe('Cypress is starting\n')

      await fs.appendFile(outPath, CYPRESS_OPEN_READY_MESSAGE)

      await expect(result).resolves.toEqual({ ready: true, code: 0 })
    })

    it('forwards stderr as it is written', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      await fs.appendFile(errPath, 'a warning\n')
      await pause()
      await fs.appendFile(errPath, 'another warning\n')
      await fs.appendFile(outPath, CYPRESS_OPEN_READY_MESSAGE)

      await result

      expect(forwardedErr).toBe('a warning\nanother warning\n')
    })

    it('keeps trying to open an output file that could not be opened at first', async () => {
      await fs.remove(outPath)

      const result = waitForReadyMessage(outPath, errPath, child as any)

      await pause()
      await fs.writeFile(outPath, CYPRESS_OPEN_READY_MESSAGE)

      await expect(result).resolves.toEqual({ ready: true, code: 0 })
    })

    it('resolves with the exit code if the child exits first', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      await fs.appendFile(outPath, 'about to fail')
      await fs.appendFile(errPath, 'it broke\n')
      child.emit('exit', 3, null)

      await expect(result).resolves.toEqual({ ready: false, code: 3 })
      expect(forwardedOut).toBe('about to fail')
      expect(forwardedErr).toBe('it broke\n')
    })

    it('does not report an app that printed the ready message and then exited as ready', async () => {
      await fs.appendFile(outPath, `starting up\n${CYPRESS_OPEN_READY_MESSAGE}\ncrashed\n`)
      await fs.appendFile(errPath, 'it broke\n')

      const result = waitForReadyMessage(outPath, errPath, child as any)

      child.emit('exit', 2, null)

      await expect(result).resolves.toEqual({ ready: false, code: 2 })
      expect(forwardedOut).toBe('starting up\ncrashed\n')
      expect(forwardedErr).toBe('it broke\n')
    })

    describe('when the app exits around its ready message', () => {
      // Timers only move when a spec advances them, so otherwise no poll runs until the exit wakes it
      // and the exit always arrives in time
      let timerDelays: (number | undefined)[]
      let fakeSetTimeout: typeof setTimeout

      // The poll is asleep once it has set its interval timer, which only an exit ends unless the spec
      // advances timers. A result that settles first ends the wait too, so a regression fails on the
      // result instead of timing out. vi.waitFor advances fake timers as it checks, so this waits
      // on setImmediate, which is not faked.
      const untilPollSleeps = async (result: Promise<unknown>) => {
        let settled = false
        const done = () => {
          settled = true
        }

        result.then(done, done)

        while (!settled && !timerDelays.includes(POLL_INTERVAL_MS)) {
          await new Promise((resolve) => setImmediate(resolve))
        }
      }

      beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

        // Not vi.spyOn: vi.restoreAllMocks would put the fake setTimeout back after vi.useRealTimers
        fakeSetTimeout = globalThis.setTimeout
        timerDelays = []
        globalThis.setTimeout = ((callback: (...args: any[]) => void, ms?: number, ...args: any[]) => {
          timerDelays.push(ms)

          return fakeSetTimeout(callback, ms, ...args)
        }) as typeof setTimeout
      })

      afterEach(() => {
        // vi.useRealTimers only restores the real setTimeout over its own fake
        globalThis.setTimeout = fakeSetTimeout
        vi.useRealTimers()
      })

      it('reports an exit that arrives during the reads without waiting out the interval', async () => {
        await fs.appendFile(outPath, 'about to fail')

        const result = waitForReadyMessage(outPath, errPath, child as any)

        child.emit('exit', 3, null)

        await expect(result).resolves.toEqual({ ready: false, code: 3 })
        expect(forwardedOut).toBe('about to fail')
      })

      it('does not report an app as ready when the ready message is only found in the read after it exited', async () => {
        await fs.appendFile(outPath, 'starting up\n')

        const result = waitForReadyMessage(outPath, errPath, child as any)

        await untilPollSleeps(result)
        expect(forwardedOut).toBe('starting up\n')
        await fs.appendFile(outPath, `${CYPRESS_OPEN_READY_MESSAGE}\n`)
        child.emit('exit', 0, null)

        await expect(result).resolves.toEqual({ ready: false, code: 0 })
        expect(forwardedOut).toBe('starting up\n')
      })

      it('does not report an app that exits just after printing the ready message as ready', async () => {
        await fs.appendFile(outPath, `starting up\n${CYPRESS_OPEN_READY_MESSAGE}\n`)

        const result = waitForReadyMessage(outPath, errPath, child as any)

        await untilPollSleeps(result)
        expect(forwardedOut).toBe('starting up\n')
        child.emit('exit', 1, null)

        await expect(result).resolves.toEqual({ ready: false, code: 1 })
      })

      it('does not report an app as ready when its exit is handled just after the interval ends', async () => {
        await fs.appendFile(outPath, `${CYPRESS_OPEN_READY_MESSAGE}\n`)

        const result = waitForReadyMessage(outPath, errPath, child as any)

        await untilPollSleeps(result)
        // As for an exit that is already pending, Node handles it after the timer that ends the interval
        setImmediate(() => child.emit('exit', 1, null))
        vi.advanceTimersByTime(POLL_INTERVAL_MS)

        await expect(result).resolves.toEqual({ ready: false, code: 1 })
      })

      it('forwards what the app printed after the ready message without the line ending that follows it', async () => {
        await fs.appendFile(outPath, `starting up\n${CYPRESS_OPEN_READY_MESSAGE}`)

        const result = waitForReadyMessage(outPath, errPath, child as any)

        await untilPollSleeps(result)
        expect(forwardedOut).toBe('starting up\n')
        await fs.appendFile(outPath, '\ncrashed\n')
        child.emit('exit', 1, null)

        await expect(result).resolves.toEqual({ ready: false, code: 1 })
        expect(forwardedOut).toBe('starting up\ncrashed\n')
      })
    })

    it('flushes held-back partial sentinel text when the child exits', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      await fs.appendFile(outPath, 'Cypress')
      await pause()
      child.emit('exit', 1, null)

      await expect(result).resolves.toEqual({ ready: false, code: 1 })
      expect(forwardedOut).toBe('Cypress')
    })

    it('maps a signal exit to 128 plus the signal number', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      child.emit('exit', null, 'SIGKILL')

      await expect(result).resolves.toEqual({ ready: false, code: 128 + os.constants.signals.SIGKILL })
    })

    it('stops waiting if the child cannot be spawned', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      child.emit('error', new Error('spawn ENOENT'))

      await expect(result).resolves.toEqual({ ready: false, code: 1 })
    })

    // A real app, writing to the files as a detached one does, so the exit is reported by Node itself
    describe('with an app process', () => {
      const spawnApp = async (script: string): Promise<cp.ChildProcess> => {
        const [outFd, errFd] = await Promise.all([fs.open(outPath, 'a'), fs.open(errPath, 'a')])

        try {
          return cp.spawn(process.execPath, ['-e', script], { stdio: ['ignore', outFd, errFd] })
        } finally {
          await Promise.all([fs.close(outFd), fs.close(errFd)])
        }
      }

      const printReady = `process.stdout.write(${JSON.stringify(`${CYPRESS_OPEN_READY_MESSAGE}\n`)})`

      it('does not report an app that exits right after printing the ready message as ready', async () => {
        const app = await spawnApp(`${printReady}; process.stderr.write('crashed\\n'); process.exit(4)`)

        await expect(waitForReadyMessage(outPath, errPath, app)).resolves.toEqual({ ready: false, code: 4 })
        expect(forwardedErr).toBe('crashed\n')
      })

      it('reports an app that keeps running after printing the ready message as ready', async () => {
        const app = await spawnApp(`${printReady}; setInterval(() => {}, 1000)`)

        try {
          await expect(waitForReadyMessage(outPath, errPath, app)).resolves.toEqual({ ready: true, code: 0 })
        } finally {
          // Windows will not remove the output files while the app still has them open
          const exited = new Promise((resolve) => app.once('exit', resolve))

          app.kill()
          await exited
        }
      })
    })
  })

  describe('openDetachedOutput', () => {
    it('opens two distinct files under the temp directory', async () => {
      vi.spyOn(os, 'tmpdir').mockReturnValue(dir)

      const opened = await openDetachedOutput()

      try {
        expect(path.dirname(opened.outPath)).toBe(dir)
        expect(path.basename(opened.outPath)).toMatch(/^cypress-open-\d+-\d+(-\d+)?\.out$/)
        expect(path.basename(opened.errPath)).toMatch(/^cypress-open-\d+-\d+(-\d+)?\.err$/)
        expect(opened.outFd).not.toBe(opened.errFd)
        expect(await fs.pathExists(opened.outPath)).toBe(true)
        expect(await fs.pathExists(opened.errPath)).toBe(true)
      } finally {
        await closeDetachedOutput(opened)
        await fs.remove(opened.outPath)
        await fs.remove(opened.errPath)
      }
    })
  })
})
