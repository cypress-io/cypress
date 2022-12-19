import Debug from 'debug'
import * as cp from 'child_process'
import { utils } from './utils'
import type { FoundBrowser } from '@packages/types'
import type { Readable } from 'stream'

export const debug = Debug('cypress:launcher:browsers')

/** starts a found browser and opens URL if given one */
export type LaunchedBrowser = cp.ChildProcessByStdio<null, Readable, Readable>

export function launch (
  browser: FoundBrowser,
  url: string,
  debuggingPort: number,
  args: string[] = [],
  browserEnv = {},
) {
  debug('launching browser %o', { browser, url })

  if (!browser.path) {
    throw new Error(`Browser ${browser.name} is missing path`)
  }

  if (url) {
    args = [url].concat(args)
  }

  const wrapped = utils.wrapSpawnOptsWithArch(browser.path, args)
  const spawnOpts: cp.SpawnOptionsWithStdioTuple<cp.StdioNull, cp.StdioPipe, cp.StdioPipe> = {
    ...wrapped.opts,
    stdio: ['ignore', 'pipe', 'pipe'],
    // allow setting default env vars such as MOZ_HEADLESS_WIDTH
    // but only if it's not already set by the environment
    env: { ...wrapped.opts.env, ...browserEnv, ...process.env },
  }

  debug('spawning browser with opts %o', { browser, url, spawnOpts })

  const proc = cp.spawn(wrapped.cmd, wrapped.args, spawnOpts)

  proc.stdout.on('data', (buf) => {
    debug('%s stdout: %s', browser.name, String(buf).trim())
  })

  proc.stderr.on('data', (buf) => {
    debug('%s stderr: %s', browser.name, String(buf).trim())
  })

  proc.on('exit', (code, signal) => {
    debug('%s exited: %o', browser.name, { code, signal })
  })

  return proc
}
