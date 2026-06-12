import http from 'http'
import Debug from 'debug'

import type { RunnerDiscoveryRecord } from './record'

const debug = Debug('cypress:cli:runner-discovery')

// The probe targets the local machine by construction — records describe
// runners that share this cache directory.
const PROBE_HOST = '127.0.0.1'
const DEFAULT_PROBE_TIMEOUT_MS = 2000

/**
 * Cheap pid probe via signal `0` — used only as a fast-fail before the real
 * liveness check (a dead pid proves the writer is gone; a live pid proves
 * nothing, since the OS recycles pids):
 *  - resolves        → some process has this pid
 *  - EPERM           → some process has it, owned by another user
 *  - ESRCH (or else) → no such process (record is certainly stale)
 */
export const isPidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)

    return true
  } catch (err: any) {
    return err?.code === 'EPERM'
  }
}

/**
 * Ask the record's writer itself whether it is alive: GET the discovery probe
 * route on the recorded server port and require it to echo the record's
 * random instanceId. A recycled pid — or even a recycled port — cannot
 * produce a matching echo, so this never reports a crashed runner as live.
 * Any failure (refused, timeout, non-200, junk body, token mismatch) means
 * "not verified"; it never throws.
 */
export const verifyRunnerRecord = (record: RunnerDiscoveryRecord, timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS): Promise<boolean> => {
  return new Promise((resolve) => {
    const request = http.get({
      host: PROBE_HOST,
      port: record.serverPort,
      path: `/__cypress/runner-discovery/${record.instanceId}`,
      timeout: timeoutMs,
    }, (response) => {
      let body = ''

      response.setEncoding('utf8')
      response.on('data', (chunk) => body += chunk)
      response.on('error', () => resolve(false))
      response.on('end', () => {
        if (response.statusCode !== 200) {
          return resolve(false)
        }

        try {
          resolve(JSON.parse(body).instanceId === record.instanceId)
        } catch (err) {
          resolve(false)
        }
      })
    })

    // Destroying on timeout surfaces as an 'error', resolving false below.
    request.on('timeout', () => request.destroy())
    request.on('error', (err) => {
      debug('liveness probe failed for pid %d on port %d: %o', record.pid, record.serverPort, err)
      resolve(false)
    })
  })
}
