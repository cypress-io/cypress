import { execFileSync } from 'child_process'
import fs from 'fs'
import tty from 'tty'
import * as env from './env'

type Size = { columns: number, rows: number }

const DEFAULT_SIZE: Size = { columns: 80, rows: 24 }

const create = (columns: unknown, rows: unknown): Size | undefined => {
  const size = { columns: Number.parseInt(String(columns), 10), rows: Number.parseInt(String(rows), 10) }

  return size.columns > 0 && size.rows > 0 ? size : undefined
}

const fromStream = (stream?: NodeJS.WriteStream): Size | undefined => {
  return stream?.columns && stream?.rows ? create(stream.columns, stream.rows) : undefined
}

// Covers piped output and apps launched without a terminal on stdout/stderr
const fromDevTty = (): Size | undefined => {
  if (process.platform === 'win32') return

  try {
    const stream = new tty.WriteStream(fs.openSync('/dev/tty', fs.constants.O_RDONLY | fs.constants.O_NONBLOCK))
    const size = create(stream.columns, stream.rows)

    stream.destroy()

    return size
  } catch {
    return
  }
}

const fromTput = (): Size | undefined => {
  if (process.platform === 'win32') return

  try {
    const tput = (arg: string) => execFileSync('tput', [arg], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 500 }).trim()

    return create(tput('cols'), tput('lines'))
  } catch {
    return
  }
}

const getSize = (): Size => {
  return fromStream(process.stdout)
    ?? fromStream(process.stderr)
    ?? create(process.env.COLUMNS, process.env.LINES)
    ?? fromDevTty()
    ?? fromTput()
    ?? { ...DEFAULT_SIZE }
}

export const get = (): Size => {
  const obj = getSize()

  if (env.get('CI')) {
    // reset to 100
    obj.columns = 100
  }

  return obj
}
