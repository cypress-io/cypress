const MASKED_PROXY_PASSWORD = '*****'

export function maskProxyPassword (proxy: string): string {
  const at = proxy.lastIndexOf('@')

  if (at === -1) {
    return proxy
  }

  const schemeEnd = proxy.indexOf('://')
  const userinfoStart = schemeEnd === -1 ? 0 : schemeEnd + 3
  const colon = proxy.indexOf(':', userinfoStart)

  if (colon === -1 || colon > at) {
    return proxy
  }

  return `${proxy.slice(0, colon + 1)}${MASKED_PROXY_PASSWORD}${proxy.slice(at)}`
}
