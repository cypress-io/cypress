import { log } from './log'
import * as cp from 'child_process'
import { browsers, FoundBrowser } from '@packages/types'

export { browsers }

/** list of the browsers we can detect and use by default */

/** starts a found browser and opens URL if given one */
export function launch (
  browser: FoundBrowser,
  url: string,
  args: string[] = [],
  defaultBrowserEnv = {},
) {
  log('launching browser %o', { browser, url })

  if (!browser.path) {
    throw new Error(`Browser ${browser.name} is missing path`)
  }

  if (url) {
    args = [url].concat(args)
  }

  log('spawning browser with args %o', { args })

  // allow setting default env vars such as MOZ_HEADLESS_WIDTH
  // but only if it's not already set by the environment
  const env = Object.assign({}, defaultBrowserEnv, process.env)

  const proc = cp.spawn(browser.path, args, { stdio: ['ignore', 'pipe', 'pipe'], env })

  proc.stdout.on('data', (buf) => {
    log('%s stdout: %s', browser.name, String(buf).trim())
  })

  proc.stderr.on('data', (buf) => {
    log('%s stderr: %s', browser.name, String(buf).trim())
  })

  proc.on('exit', (code, signal) => {
    log('%s exited: %o', browser.name, { code, signal })
  })

  return proc
}
