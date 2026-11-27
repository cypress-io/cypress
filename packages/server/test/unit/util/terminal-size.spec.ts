import fs from 'fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as env from '../../../lib/util/env'
import * as terminalSize from '../../../lib/util/terminal-size'

const { execFileSync } = vi.hoisted(() => ({ execFileSync: vi.fn() }))

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>()

  return { ...actual, default: { ...actual, execFileSync }, execFileSync }
})

const setStreamSize = (stream: NodeJS.WriteStream, columns?: number, rows?: number) => {
  vi.spyOn(stream, 'columns', 'get').mockReturnValue(columns as number)
  vi.spyOn(stream, 'rows', 'get').mockReturnValue(rows as number)
}

const withPlatform = (platform: NodeJS.Platform, fn: () => void) => {
  const original = Object.getOwnPropertyDescriptor(process, 'platform')!

  Object.defineProperty(process, 'platform', { value: platform })

  try {
    fn()
  } finally {
    Object.defineProperty(process, 'platform', original)
  }
}

describe('lib/util/terminal-size', () => {
  beforeEach(() => {
    // vitest's worker streams are not TTYs, so give them accessors to spy on
    for (const stream of [process.stdout, process.stderr]) {
      Object.defineProperty(stream, 'columns', { configurable: true, get: () => undefined })
      Object.defineProperty(stream, 'rows', { configurable: true, get: () => undefined })
    }

    vi.spyOn(env, 'get').mockReturnValue(undefined)
    execFileSync.mockReset().mockImplementation(() => {
      throw new Error('ENOENT')
    })

    vi.stubEnv('COLUMNS', '')
    vi.stubEnv('LINES', '')
    vi.stubEnv('FORCE_TTY_COLUMNS', '')
    vi.stubEnv('FORCE_TTY_ROWS', '')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    for (const stream of [process.stdout, process.stderr]) {
      delete (stream as any).columns
      delete (stream as any).rows
    }
  })

  it('uses the stdout size', () => {
    setStreamSize(process.stdout, 120, 40)
    setStreamSize(process.stderr, 90, 30)

    expect(terminalSize.get()).toEqual({ columns: 120, rows: 40 })
  })

  it('uses the stderr size when stdout is not a terminal', () => {
    setStreamSize(process.stderr, 90, 30)

    expect(terminalSize.get()).toEqual({ columns: 90, rows: 30 })
  })

  it('uses COLUMNS and LINES when neither stream is a terminal', () => {
    vi.stubEnv('COLUMNS', '132')
    vi.stubEnv('LINES', '50')

    expect(terminalSize.get()).toEqual({ columns: 132, rows: 50 })
  })

  it('uses the size forwarded by the CLI when the streams are piped', () => {
    vi.stubEnv('FORCE_TTY_COLUMNS', '133')
    vi.stubEnv('FORCE_TTY_ROWS', '41')

    expect(terminalSize.get()).toEqual({ columns: 133, rows: 41 })
  })

  it('prefers COLUMNS and LINES over the size forwarded by the CLI', () => {
    vi.stubEnv('COLUMNS', '132')
    vi.stubEnv('LINES', '50')
    vi.stubEnv('FORCE_TTY_COLUMNS', '133')
    vi.stubEnv('FORCE_TTY_ROWS', '41')

    expect(terminalSize.get()).toEqual({ columns: 132, rows: 50 })
  })

  it('reads the controlling terminal size and closes the file descriptor', () => {
    withPlatform('darwin', () => {
      vi.spyOn(fs, 'openSync').mockReturnValue(99)
      const closeSync = vi.spyOn(fs, 'closeSync').mockImplementation(() => {})

      execFileSync.mockReturnValue('41 133\n')

      expect(terminalSize.get()).toEqual({ columns: 133, rows: 41 })
      expect(execFileSync).toHaveBeenCalledWith('stty', ['size'], expect.objectContaining({ stdio: [99, 'pipe', 'ignore'] }))
      expect(closeSync).toHaveBeenCalledWith(99)
    })
  })

  it('defaults to 80x24 when no size can be found', () => {
    withPlatform('linux', () => {
      vi.spyOn(fs, 'openSync').mockImplementation(() => {
        throw new Error('ENXIO')
      })

      expect(terminalSize.get()).toEqual({ columns: 80, rows: 24 })
      expect(execFileSync).toHaveBeenCalledWith('tput', ['cols'], expect.anything())
    })
  })

  it('does not look up the terminal on Windows when no size is available', () => {
    withPlatform('win32', () => {
      const openSync = vi.spyOn(fs, 'openSync')

      expect(terminalSize.get()).toEqual({ columns: 80, rows: 24 })
      expect(openSync).not.toHaveBeenCalled()
      expect(execFileSync).not.toHaveBeenCalled()
    })
  })

  it('sets columns to 100 in CI', () => {
    setStreamSize(process.stdout, 120, 40)
    vi.mocked(env.get).mockReturnValue('1')

    expect(terminalSize.get()).toEqual({ columns: 100, rows: 40 })
  })
})
