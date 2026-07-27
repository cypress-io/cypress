export type EgressPolicyLaunchOpts = {
  proxyServer?: string
  proxyBypassList?: string
}

const getProxyEnv = (name: 'HTTP_PROXY' | 'HTTPS_PROXY') => {
  const value = process.env[name.toLowerCase()] || process.env[name]

  if (!value || value === 'false' || value === '0') {
    return
  }

  return value
}

export function translateEgressPolicyToLaunchOpts (): EgressPolicyLaunchOpts {
  const httpProxy = getProxyEnv('HTTP_PROXY')
  const httpsProxy = getProxyEnv('HTTPS_PROXY') || httpProxy

  if (!httpProxy && !httpsProxy) {
    return {}
  }

  const proxyServer = httpProxy && httpsProxy && httpProxy !== httpsProxy
    ? `http=${httpProxy};https=${httpsProxy}`
    : httpProxy || `https=${httpsProxy}`
  const noProxy = process.env.no_proxy || process.env.NO_PROXY
  const bypassRules = noProxy?.split(',').map((rule) => rule.trim()).filter(Boolean) ?? []

  if (!bypassRules.includes('<-loopback>')) {
    bypassRules.unshift('<-loopback>')
    bypassRules.push(...['127.0.0.1', '::1', 'localhost'].filter((rule) => !bypassRules.includes(rule)))
  }

  return {
    proxyServer,
    proxyBypassList: bypassRules.join(','),
  }
}
