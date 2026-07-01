import http from 'http'
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

export const verifyInstanceRecord = (record: CypressInstance, timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS): Promise<LiveInstanceState | null> => {
  return new Promise((resolve) => {
    const request = http.get({
      host: PROBE_HOST,
      port: record.serverPort,
      path: instancesProbePath(record.instanceId),
      timeout: timeoutMs,
    }, (response) => {
      let body = ''

      response.setEncoding('utf8')
      response.on('data', (chunk) => body += chunk)
      response.on('error', () => resolve(null))
      response.on('end', () => {
        if (response.statusCode !== 200) {
          return resolve(null)
        }

        try {
          const live = JSON.parse(body)

          if (live.instanceId !== record.instanceId) {
            return resolve(null)
          }

          resolve({
            ...record,
            cdpBrowserWsUrl: typeof live.cdpBrowserWsUrl === 'string' ? live.cdpBrowserWsUrl : null,
          })
        } catch {
          resolve(null)
        }
      })
    })

    request.on('timeout', () => request.destroy())
    request.on('error', (err) => {
      debug('liveness probe failed for pid %d on port %d: %o', record.pid, record.serverPort, err)
      resolve(null)
    })
  })
}
