import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import tty from 'tty'
import * as ttyUtil from '../../../lib/util/tty'
import * as terminalSize from '../../../lib/util/terminal-size'

const ttys = [process.stdin.isTTY, process.stdout.isTTY, process.stderr.isTTY]

describe('lib/util/tty', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getWindowSize', () => {
    it('polyfills stdout and stderr getWindowSize', () => {
      vi.spyOn(tty, 'isatty').mockReturnValue(true)
      vi.spyOn(terminalSize, 'get').mockReturnValue({ columns: 10, rows: 20 })

      Object.defineProperty(process.stdout, 'getWindowSize', {
        configurable: true,
        writable: true,
        value: undefined,
      })

      Object.defineProperty(process.stderr, 'getWindowSize', {
        configurable: true,
        writable: true,
        value: undefined,
      })

      ttyUtil.override()

      expect(process.stdout.getWindowSize()).toEqual([10, 20])
      expect(process.stderr.getWindowSize()).toEqual([10, 20])
    })
  })

  describe('.override', () => {
    beforeEach(() => {
      process.env.FORCE_STDIN_TTY = '1'
      process.env.FORCE_STDOUT_TTY = '1'
      process.env.FORCE_STDERR_TTY = '1'

      // do this so can we see when its modified
      process.stdin.isTTY = 'foo' as any
      process.stdout.isTTY = 'foo' as any
      process.stderr.isTTY = 'foo' as any
    })

    afterEach(() => {
      // restore sanity
      process.stdin.isTTY = ttys[0]
      process.stdout.isTTY = ttys[1]
      process.stderr.isTTY = ttys[2]
    })

    it('is noop when not forcing in env', () => {
      delete process.env.FORCE_STDIN_TTY
      delete process.env.FORCE_STDOUT_TTY
      delete process.env.FORCE_STDERR_TTY

      ttyUtil.override()

      expect(process.stdin.isTTY).toBe('foo')
      expect(process.stdout.isTTY).toBe('foo')

      expect(process.stderr.isTTY).toBe('foo')
    })

    it('forces process.stderr.isTTY to be true', () => {
      ttyUtil.override()

      expect(process.stdin.isTTY).toBe(true)
      expect(process.stdout.isTTY).toBe(true)

      expect(process.stderr.isTTY).toBe(true)
    })

    it('modifies isatty calls', () => {
      delete process.env.FORCE_STDERR_TTY

      const isatty = vi.spyOn(tty, 'isatty')

      ttyUtil.override()

      // should slurp up the first two calls
      // and only proxy through the 3rd call
      // for stderr
      tty.isatty(0)
      tty.isatty(1)
      tty.isatty(2)

      expect(isatty.mock.calls.length).toBe(1)

      expect(isatty).toHaveBeenCalledWith(2)
    })
  })
})
