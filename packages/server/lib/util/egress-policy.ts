import debugModule from 'debug'

const debug = debugModule('cypress:server:util:egress-policy')

export type EgressPolicyLaunchOpts = {
  proxyServer?: string
  proxyBypassList?: string
}

/**
 * Translates the user's egress policy - upstream proxy and `hosts` - into Chromium
 * launch options, for when Cypress's MITM proxy is disabled and the browser is the
 * only network egress.
 *
 * Reads the proxy env vars normalized by `loadSystemProxySettings()` at startup,
 * which resolves lowercase vars, npm proxy config, and the Windows registry.
 */
export function translateEgressPolicyToLaunchOpts (hosts?: { [host: string]: string } | null): EgressPolicyLaunchOpts {
  const httpProxy = process.env.HTTP_PROXY
  const httpsProxy = process.env.HTTPS_PROXY

  if (!httpProxy && !httpsProxy) {
    return {}
  }

  const proxyServer = httpProxy && httpsProxy && httpProxy !== httpsProxy
    ? `http=${httpProxy};https=${httpsProxy}`
    : httpProxy || `https=${httpsProxy}`

  // Chromium's implicit rules already keep loopback - and with it the Cypress
  // server - off the proxy. `<-loopback>` subtracts those rules, which would send
  // the browser's Cypress traffic to an upstream proxy that cannot route it, so
  // it is dropped even when the user asked for it. `util/proxy.ts` keeps the token
  // because Node treats it as an inert sentinel rather than an operator.
  const bypassRules = (process.env.NO_PROXY ?? '').split(',')
  .map((rule) => rule.trim())
  .filter((rule) => {
    if (rule === '<-loopback>') {
      debug('dropping <-loopback> so the browser can reach the Cypress server directly')

      return false
    }

    return Boolean(rule)
  })

  // Chromium picks the proxy from the URL's host before resolving it, and never
  // resolves a proxied host locally, so `--host-resolver-rules` cannot remap a
  // `hosts` entry unless that entry also bypasses the proxy.
  bypassRules.push(...Object.keys(hosts ?? {}).filter((host) => !bypassRules.includes(host)))

  return {
    proxyServer,
    ...(bypassRules.length ? { proxyBypassList: bypassRules.join(',') } : {}),
  }
}
