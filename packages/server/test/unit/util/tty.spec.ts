import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import tty from 'tty'
import * as ttyUtil from '../../../lib/util/tty'
import * as terminalSize from '../../../lib/util/terminal-size'

const ttys = [process.stdin.isTTY, process.stdout.isTTY, process.stderr.isTTY]
const originalIsatty = tty.isatty

describe('lib/util/tty', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()

    tty.isatty = originalIsatty

    // Streams inherit getWindowSize from tty.WriteStream, so dropping the own property restores the original
    Reflect.deleteProperty(process.stdout, 'getWindowSize')
    Reflect.deleteProperty(process.stderr, 'getWindowSize')
  })

  describe('getWindowSize', () => {
    it('polyfills stdout and stderr getWindowSize', () => {
      vi.spyOn(tty, 'isatty').mockReturnValue(true)
      vi.spyOn(terminalSize, 'get').mockReturnValue({ columns: 10, rows: 20 })

      Object.defineProperty(process.stdout, 'getWindowSize', { value: undefined, configurable: true, writable: true })
      Object.defineProperty(process.stderr, 'getWindowSize', { value: undefined, configurable: true, writable: true })

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

      process.stdin.isTTY = 'foo' as unknown as boolean
      process.stdout.isTTY = 'foo' as unknown as boolean
      process.stderr.isTTY = 'foo' as unknown as boolean
    })

    afterEach(() => {
      process.stdin.isTTY = ttys[0]
      process.stdout.isTTY = ttys[1]
      process.stderr.isTTY = ttys[2]
    })

    it('is noop when not forcing in env', () => {
      vi.stubEnv('FORCE_STDIN_TTY', undefined)
      vi.stubEnv('FORCE_STDOUT_TTY', undefined)
      vi.stubEnv('FORCE_STDERR_TTY', undefined)

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
      vi.stubEnv('FORCE_STDERR_TTY', undefined)

      const isatty = vi.spyOn(tty, 'isatty')

      ttyUtil.override()

      tty.isatty(0)
      tty.isatty(1)
      tty.isatty(2)

      expect(isatty.mock.calls.length).toBe(1)

      expect(isatty.mock.calls[0][0]).toBe(2)
    })
  })
})
