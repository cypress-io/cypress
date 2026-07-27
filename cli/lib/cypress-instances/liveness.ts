import Debug from 'debug'

import { instancesProbePath } from './record'
import type { LiveInstanceState, CypressInstance } from './record'

const debug = Debug('cypress:cli:cypress-instances')

const PROBE_HOST = '127.0.0.1'
const DEFAULT_PROBE_TIMEOUT_MS = 2000

export const isPidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)

    return true
  } catch (err: any) {
    return err?.code === 'EPERM'
  }
}

// The server reports `cdpBrowserWsUrl` from in-memory state that it only clears
// when the browser *process* exits, so a closed browser window whose process
// lingers leaves the url stale. Hit the browser's own DevTools HTTP endpoint
// (Chromium exposes `/json/version` whenever the CDP port is open) to confirm
// the browser is really reachable before trusting the url.
const cdpEndpointReachable = async (cdpBrowserWsUrl: string, timeoutMs: number): Promise<boolean> => {
  let versionUrl: string

  try {
    const { protocol, host } = new URL(cdpBrowserWsUrl)

    versionUrl = `${protocol === 'wss:' ? 'https:' : 'http:'}//${host}/json/version`
  } catch (err) {
    debug('could not derive a CDP version url from %s: %o', cdpBrowserWsUrl, err)

    return false
  }

  try {
    const response = await fetch(versionUrl, { signal: AbortSignal.timeout(timeoutMs) })

    return response.ok
  } catch (err) {
    debug('CDP endpoint unreachable at %s: %o', versionUrl, err)

    return false
  }
}

export const verifyInstanceRecord = async (record: CypressInstance, timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS): Promise<LiveInstanceState | null> => {
  const url = `http://${PROBE_HOST}:${record.serverPort}${instancesProbePath(record.instanceId)}`

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })

    if (response.status !== 200) {
      return null
    }

    const live = await response.json() as { instanceId?: unknown, cdpBrowserWsUrl?: unknown }

    if (live.instanceId !== record.instanceId) {
      return null
    }

    const cdpBrowserWsUrl = typeof live.cdpBrowserWsUrl === 'string' ? live.cdpBrowserWsUrl : null

    return {
      ...record,
      cdpBrowserWsUrl: cdpBrowserWsUrl && await cdpEndpointReachable(cdpBrowserWsUrl, timeoutMs) ? cdpBrowserWsUrl : null,
    }
  } catch (err) {
    debug('liveness probe failed for pid %d on port %d: %o', record.pid, record.serverPort, err)

    return null
  }
}
