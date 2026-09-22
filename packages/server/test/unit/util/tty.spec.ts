import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import tty from 'tty'
import * as ttyUtil from '../../../lib/util/tty'
import * as terminalSize from '../../../lib/util/terminal-size'

const ttys = [process.stdin.isTTY, process.stdout.isTTY, process.stderr.isTTY]

describe('lib/util/tty', () => {
  describe('getWindowSize', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('polyfills stdout and stderr getWindowSize', () => {
      vi.spyOn(tty, 'isatty').mockReturnValue(true)
      vi.spyOn(terminalSize, 'get').mockReturnValue({ columns: 10, rows: 20 })

      vi.spyOn(process.stdout, 'getWindowSize').mockReturnValue(undefined as unknown as [number, number])
      vi.spyOn(process.stderr, 'getWindowSize').mockReturnValue(undefined as unknown as [number, number])

      ttyUtil.override()

      expect(process.stdout.getWindowSize()).toEqual([10, 20])
      expect(process.stderr.getWindowSize()).toEqual([10, 20])
    })
  })

  describe('.override', () => {
    beforeEach(() => {
      vi.stubEnv('FORCE_STDIN_TTY', '1')
      vi.stubEnv('FORCE_STDOUT_TTY', '1')
      vi.stubEnv('FORCE_STDERR_TTY', '1')

      // do this so can we see when its modified
      process.stdin.isTTY = 'foo' as unknown as boolean
      process.stdout.isTTY = 'foo' as unknown as boolean
      process.stderr.isTTY = 'foo' as unknown as boolean
    })

    afterEach(() => {
      vi.unstubAllEnvs()
      vi.restoreAllMocks()

      // restore sanity
      process.stdin.isTTY = ttys[0]
      process.stdout.isTTY = ttys[1]
      process.stderr.isTTY = ttys[2]
    })

    it('is noop when not forcing in env', () => {
      vi.unstubAllEnvs()

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
      vi.unstubAllEnvs()
      vi.stubEnv('FORCE_STDIN_TTY', '1')
      vi.stubEnv('FORCE_STDOUT_TTY', '1')

      const isatty = vi.spyOn(tty, 'isatty')

      ttyUtil.override()

      // should slurp up the first two calls
      // and only proxy through the 3rd call
      // for stderr
      tty.isatty(0)
      tty.isatty(1)
      tty.isatty(2)

      expect(isatty).toHaveBeenCalledTimes(1)

      expect(isatty).toHaveBeenCalledWith(2)
    })
  })
})
