// Socket-level codes for a connection that failed or dropped before Cypress
// Cloud answered: no network, DNS failure, or a firewall refusing or
// dropping the connection. Filesystem codes such as ENOSPC are not included.
const NETWORK_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'EHOSTDOWN',
  'ENETUNREACH',
  'ENETDOWN',
  'ENOTFOUND',
  'EPIPE',
  'EAGAIN',
])

export const isNetworkErrorCode = (errorCode: unknown): errorCode is string => {
  return typeof errorCode === 'string' && NETWORK_ERROR_CODES.has(errorCode)
}
