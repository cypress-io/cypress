import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import os from 'os'
import path from 'path'
import { EventEmitter } from 'events'
import fs from 'fs-extra'
import { stdout, stderr } from 'process'
import {
  waitForReadyMessage,
  openDetachedOutput,
  closeDetachedOutput,
  pruneStaleDetachedOutput,
  CYPRESS_OPEN_READY_MESSAGE,
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

    it('does not throw when the directory cannot be read', async () => {
      vi.spyOn(os, 'tmpdir').mockReturnValue(path.join(dir, 'missing'))

      await expect(pruneStaleDetachedOutput()).resolves.toBeUndefined()
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

    it('resolves with the exit code if the child closes first', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      await fs.appendFile(outPath, 'about to fail')
      await fs.appendFile(errPath, 'it broke\n')
      child.emit('close', 3, null)

      await expect(result).resolves.toEqual({ ready: false, code: 3 })
      expect(forwardedOut).toBe('about to fail')
      expect(forwardedErr).toBe('it broke\n')
    })

    it('flushes held-back partial sentinel text when the child closes', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      await fs.appendFile(outPath, 'Cypress')
      await pause()
      child.emit('close', 1, null)

      await expect(result).resolves.toEqual({ ready: false, code: 1 })
      expect(forwardedOut).toBe('Cypress')
    })

    it('maps a signal exit to 128 plus the signal number', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      child.emit('close', null, 'SIGKILL')

      await expect(result).resolves.toEqual({ ready: false, code: 128 + os.constants.signals.SIGKILL })
    })

    it('stops waiting if the child cannot be spawned', async () => {
      const result = waitForReadyMessage(outPath, errPath, child as any)

      child.emit('error', new Error('spawn ENOENT'))

      await expect(result).resolves.toEqual({ ready: false, code: 1 })
    })
  })

  describe('openDetachedOutput', () => {
    it('opens two distinct files under the temp directory', async () => {
      const opened = await openDetachedOutput()

      try {
        expect(path.dirname(opened.outPath)).toBe(os.tmpdir())
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
