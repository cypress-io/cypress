import * as env from './env'

type TerminalSize = { columns: number, rows: number }

let terminalSize: (() => TerminalSize) | undefined
let loadPromise: Promise<void> | undefined

// `terminal-size` is an ESM-only package, so it cannot be `require`d directly in
// this CJS-target TypeScript package (see `lib/exec.ts` for the same constraint
// with `shell-env`). We load it once via tsx's `tsImport` and cache the function
// so that `get()` can stay synchronous — `tty.ts` installs it as a synchronous
// `process.stdout.getWindowSize` polyfill that third-party libraries call
// synchronously, so it cannot become async.
export const load = (): Promise<void> => {
  if (!loadPromise) {
    loadPromise = (async () => {
      const { tsImport } = require('tsx/esm/api')
      const { default: terminalSizeFn } = await tsImport('terminal-size', __filename) as typeof import('terminal-size')

      terminalSize = terminalSizeFn
    })()
  }

  return loadPromise
}

// Mirrors `terminal-size`'s primary detection path so the result is correct in
// the common (TTY) case even if `get()` is reached before `load()` resolves.
const fallback = (): TerminalSize => {
  const { columns, rows } = process.stdout

  if (columns && rows) {
    return { columns, rows }
  }

  return { columns: 80, rows: 24 }
}

export const get = (): TerminalSize => {
  if (!terminalSize) {
    // kick off the async ESM import so subsequent synchronous calls can resolve
    // against the real module; until it loads, fall back to a best-effort size
    load().catch(() => {})
  }

  const size = terminalSize ? terminalSize() : fallback()

  if (env.get('CI')) {
    // reset to 100
    size.columns = 100
  }

  return size
}
