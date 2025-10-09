import Debug from 'debug'
import type * as cp from 'child_process'
import type { FoundBrowser } from '@packages/types'
import type { Readable } from 'stream'
import { PlatformFactory } from './platforms/PlatformFactory'

export const debug = Debug('cypress:launcher:browsers')

/** starts a found browser and opens URL if given one */
export type LaunchedBrowser = cp.ChildProcessByStdio<null, Readable, Readable>

// NOTE: For Firefox, geckodriver is used to launch the browser
export function launch (
  browser: FoundBrowser,
  url: string,
  args: string[] = [],
  browserEnv = {},
) {
  debug('launching browser %o', { browser, url })

  // We shouldn't need to check this, because FoundBrowser.path is
  // not optional.
  if (!browser.path) {
    throw new Error(`Browser ${browser.name} is missing path`)
  }

  return PlatformFactory.select().launch(browser, url, args, browserEnv)
}
