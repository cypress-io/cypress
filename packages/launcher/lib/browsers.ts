import Bluebird from 'bluebird'
import Debug from 'debug'
import type * as cp from 'child_process'
import { utils } from './utils'
import type { FoundBrowser } from '@packages/types'
import type { Readable } from 'stream'

export const debug = Debug('cypress:launcher:browsers')

const WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX =
  /^WebDriver BiDi listening on (ws:\/\/.*)$/

/** starts a found browser and opens URL if given one */
export type LaunchedBrowser = cp.ChildProcessByStdio<null, Readable, Readable>

export function launch (
  browser: FoundBrowser,
  url: string,
  debuggingPort: number,
  args: string[] = [],
  browserEnv = {},
  extraOptions = {
    waitForBiDiWebsocketUrl: false,
  },
) {
  const waitForBiDiWebsocketUrl = extraOptions?.waitForBiDiWebsocketUrl || false

  debug('launching browser %o', { browser, url })

  if (!browser.path) {
    throw new Error(`Browser ${browser.name} is missing path`)
  }

  if (url) {
    args = [url].concat(args)
  }

  const spawnOpts: cp.SpawnOptionsWithStdioTuple<cp.StdioNull, cp.StdioPipe, cp.StdioPipe> = {
    stdio: ['ignore', 'pipe', 'pipe'],
    // stdio: ['ignore', 'pipe', 'pipe'],
    // allow setting default env vars such as MOZ_HEADLESS_WIDTH
    // but only if it's not already set by the environment
    env: { ...browserEnv, ...process.env },
  }

  let BiDiResolver
  // create a promise to wait for the BiDi stderr output to connect the BiDi websocket.
  // timeout if we haven't connected in 30 seconds
  const BiDiWebsocketUrlPromise = new Bluebird.Promise<string>((resolve) => {
    BiDiResolver = resolve
  }).timeout(30000)

  if (!waitForBiDiWebsocketUrl) {
    // if we aren't using webdriver BiDi, then resolve this promise as we don't need to wait
    BiDiResolver('')
  }

  debug('spawning browser with opts %o', { browser, url, spawnOpts })

  debugger
  const proc = utils.spawnWithArch(browser.path, args, spawnOpts)

  proc.stdout.on('data', (buf) => {
    debug('%s stdout: %s', browser.name, String(buf).trim())
  })

  proc.stderr.on('data', (buf) => {
    const line = String(buf).trim()

    debug('%s stder-r: %s', browser.name, line)
    if (waitForBiDiWebsocketUrl && BiDiWebsocketUrlPromise.isPending()) {
      const lines = line.split('\n')

      for (const l of lines) {
        const match = l.match(WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX)

        if (!match) {
          continue
        }

        const wsUrl = match[1]!

        debug(`found match for WebdriverBidi websocketUrl: ${wsUrl}`)
        BiDiResolver(wsUrl)
        break
      }
    }
  })

  proc.on('exit', (code, signal) => {
    debug('%s exited: %o', browser.name, { code, signal })
  })

  return { proc, waitingForBiDiWebsocketUrl: BiDiWebsocketUrlPromise }
}
