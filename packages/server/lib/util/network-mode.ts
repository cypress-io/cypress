import Debug from 'debug'
import type { FoundBrowser } from '@packages/types'

const debug = Debug('cypress:server:network-mode')

/**
 * The browser network path intercepts browser traffic in the browser itself
 * instead of routing it through the HTTP/1 MITM proxy. Only Chrome, Chromium,
 * and Edge implement it; Firefox, WebKit, and Electron stay on the proxy no
 * matter what `forceHttp1` says.
 */
export function isBrowserNetworkMode (config: { forceHttp1?: boolean }, browser: Pick<FoundBrowser, 'family' | 'name'>): boolean {
  if (config.forceHttp1) {
    return false
  }

  if (browser.family !== 'chromium') {
    debug('%s has no native browser (CDP) path; using the HTTP/1 proxy instead', browser.name)

    return false
  }

  // Electron could take the browser network path, but it is deprecated as a test
  // browser, so it is not carried onto it.
  if (browser.name === 'electron') {
    debug('%s is deprecated as a test browser; using the HTTP/1 proxy instead', browser.name)

    return false
  }

  return true
}

export function ensureProxyServer (cfg: { proxyServer?: string }): string {
  if (cfg.proxyServer) {
    return cfg.proxyServer
  }

  throw new Error('Missing proxyServer in launch')
}
