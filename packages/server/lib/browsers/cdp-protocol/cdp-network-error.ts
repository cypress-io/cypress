import type { Protocol } from 'devtools-protocol'

type NodeNetworkError = {
  code: string
  syscall: string
  address?: 'host' | 'hostPort'
}

/**
 * CDP net errors that name the same condition as a Node connection error.
 *
 * On the MITM path Cypress performs the upstream request itself, so a failed
 * connection reaches `cy.intercept` as Node's own error — code and all. Under
 * this transport the browser makes the request and reports the condition as a
 * `Network.ErrorReason` instead. Translating the unambiguous ones keeps both
 * the user-visible message and the driver's classification (`network-error.ts`
 * selects the `responseTimeout` message off `ETIMEDOUT`/`ESOCKETTIMEDOUT`)
 * independent of which transport ran.
 *
 * Reasons with no single Node equivalent — `Failed`, `Aborted`, `AccessDenied`,
 * `BlockedByClient`, `BlockedByResponse`, `ConnectionFailed` — are deliberately
 * absent: inventing a code for them would misreport what the browser saw.
 */
const NODE_NETWORK_ERRORS: Partial<Record<Protocol.Network.ErrorReason, NodeNetworkError>> = {
  ConnectionRefused: { code: 'ECONNREFUSED', syscall: 'connect', address: 'hostPort' },
  ConnectionReset: { code: 'ECONNRESET', syscall: 'read' },
  ConnectionClosed: { code: 'ECONNRESET', syscall: 'read' },
  ConnectionAborted: { code: 'ECONNABORTED', syscall: 'connect', address: 'hostPort' },
  TimedOut: { code: 'ETIMEDOUT', syscall: 'connect', address: 'hostPort' },
  NameNotResolved: { code: 'ENOTFOUND', syscall: 'getaddrinfo', address: 'host' },
  AddressUnreachable: { code: 'EHOSTUNREACH', syscall: 'connect', address: 'hostPort' },
  InternetDisconnected: { code: 'ENETUNREACH', syscall: 'connect', address: 'hostPort' },
}

// Node renders the peer as `host:port`, with an IPv6 literal unbracketed
// (`connect ECONNREFUSED ::1:3333`).
function formatAddress (url: string, address?: NodeNetworkError['address']): string {
  if (!address) {
    return ''
  }

  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return ''
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '')

  if (address === 'host') {
    return ` ${hostname}`
  }

  return ` ${hostname}:${parsed.port || (parsed.protocol === 'https:' ? '443' : '80')}`
}

/**
 * Builds the error a failed CDP Fetch response pause rejects with, shaped like
 * the Node error the MITM path would have produced for the same condition.
 */
export function toNetworkError (url: string, errorReason: string): Error {
  const mapped = NODE_NETWORK_ERRORS[errorReason as Protocol.Network.ErrorReason]

  if (!mapped) {
    return new Error(`CDP Fetch response failed for ${url}: ${errorReason}`)
  }

  const err = new Error(`${mapped.syscall} ${mapped.code}${formatAddress(url, mapped.address)}`) as Error & { code: string }

  err.code = mapped.code

  return err
}
