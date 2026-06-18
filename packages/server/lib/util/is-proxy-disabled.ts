export function isProxyDisabled (): boolean {
  return process.env.CYPRESS_INTERNAL_DISABLE_PROXY === '1'
}

export function isProxyEnabled (): boolean {
  return !isProxyDisabled()
}

export function ensureProxyServer (cfg: { proxyServer?: string }): string {
  if (cfg.proxyServer) {
    return cfg.proxyServer
  }

  throw new Error('Missing proxyServer in launch')
}
