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

    return {
      ...record,
      cdpBrowserWsUrl: typeof live.cdpBrowserWsUrl === 'string' ? live.cdpBrowserWsUrl : null,
    }
  } catch (err) {
    debug('liveness probe failed for pid %d on port %d: %o', record.pid, record.serverPort, err)

    return null
  }
}
