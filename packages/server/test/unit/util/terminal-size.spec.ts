import childProcess from 'child_process'
import fs from 'fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as env from '../../../lib/util/env'
import * as terminalSize from '../../../lib/util/terminal-size'

const setStreamSize = (stream: NodeJS.WriteStream, columns?: number, rows?: number) => {
  vi.spyOn(stream, 'columns', 'get').mockReturnValue(columns as number)
  vi.spyOn(stream, 'rows', 'get').mockReturnValue(rows as number)
}

describe('lib/util/terminal-size', () => {
  beforeEach(() => {
    // vitest's worker streams are not TTYs, so give them accessors to spy on
    for (const stream of [process.stdout, process.stderr]) {
      Object.defineProperty(stream, 'columns', { configurable: true, get: () => undefined })
      Object.defineProperty(stream, 'rows', { configurable: true, get: () => undefined })
    }

    vi.spyOn(env, 'get').mockReturnValue(undefined)
    vi.stubEnv('COLUMNS', '')
    vi.stubEnv('LINES', '')
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

  it('defaults to 80x24 when no size can be found', () => {
    vi.spyOn(fs, 'openSync').mockImplementation(() => {
      throw new Error('ENXIO')
    })

    vi.spyOn(childProcess, 'execFileSync').mockImplementation(() => {
      throw new Error('ENOENT')
    })

    expect(terminalSize.get()).toEqual({ columns: 80, rows: 24 })
  })

  it('sets columns to 100 in CI', () => {
    setStreamSize(process.stdout, 120, 40)
    vi.mocked(env.get).mockReturnValue('1')

    expect(terminalSize.get()).toEqual({ columns: 100, rows: 40 })
  })
})
