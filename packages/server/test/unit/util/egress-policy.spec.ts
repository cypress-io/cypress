import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { translateEgressPolicyToLaunchOpts } from '../../../lib/util/egress-policy'

describe('lib/util/egress-policy', () => {
  const originalEnv = {
    HTTP_PROXY: process.env.HTTP_PROXY,
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    NO_PROXY: process.env.NO_PROXY,
  }

  beforeEach(() => {
    delete process.env.HTTP_PROXY
    delete process.env.HTTPS_PROXY
    delete process.env.NO_PROXY
  })

  afterAll(() => {
    Object.entries(originalEnv).forEach(([name, value]) => {
      if (value === undefined) {
        delete process.env[name]
      } else {
        process.env[name] = value
      }
    })
  })

  it('returns no launch options without an upstream proxy', () => {
    process.env.NO_PROXY = 'example.com'

    expect(translateEgressPolicyToLaunchOpts()).toStrictEqual({})
  })

  it('leaves the bypass list off so implicit loopback rules apply', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'

    expect(translateEgressPolicyToLaunchOpts()).toStrictEqual({
      proxyServer: 'http://proxy.example:8080',
    })
  })

  it('preserves distinct HTTP_PROXY and HTTPS_PROXY rules', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'
    process.env.HTTPS_PROXY = 'http://secure-proxy.example:8443'
    process.env.NO_PROXY = 'localhost, example.com'

    expect(translateEgressPolicyToLaunchOpts()).toStrictEqual({
      proxyServer: 'http=http://proxy.example:8080;https=http://secure-proxy.example:8443',
      proxyBypassList: 'localhost,example.com',
    })
  })

  it('maps HTTPS_PROXY to the https scheme when HTTP_PROXY is unset', () => {
    process.env.HTTPS_PROXY = 'http://secure-proxy.example:8443'

    expect(translateEgressPolicyToLaunchOpts()).toStrictEqual({
      proxyServer: 'https=http://secure-proxy.example:8443',
    })
  })

  it('drops <-loopback> so the browser can reach the cypress server', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'
    process.env.NO_PROXY = 'localhost,<-loopback>,example.com'

    expect(translateEgressPolicyToLaunchOpts()).toStrictEqual({
      proxyServer: 'http://proxy.example:8080',
      proxyBypassList: 'localhost,example.com',
    })
  })

  it('bypasses the proxy for hosts so they can be remapped', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'
    process.env.NO_PROXY = 'example.com'

    expect(translateEgressPolicyToLaunchOpts({
      'example.com': '127.0.0.1',
      '*.foobar.com': '127.0.0.1',
    })).toStrictEqual({
      proxyServer: 'http://proxy.example:8080',
      proxyBypassList: 'example.com,*.foobar.com',
    })
  })

  // Chromium picks the proxy from the URL's host before resolving it, so a steered origin
  // would be sent to the proxy by name and the mTLS bridge never reached. The bridge makes
  // the proxied connection itself instead.
  // Only `hostname:port` is steered at the bridge, so bypassing the bare host would take
  // the host's other ports and schemes off the proxy as well - they would then be dialed
  // directly and fail wherever direct egress is blocked.
  it('bypasses the proxy only for the bridged origin, port included', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'

    expect(translateEgressPolicyToLaunchOpts(null, [
      { hostname: 'secure.example.com', port: 443 },
      { hostname: '*.internal.example', port: 8443 },
    ])).toStrictEqual({
      proxyServer: 'http://proxy.example:8080',
      proxyBypassList: 'secure.example.com:443,*.internal.example:8443',
    })
  })

  // A `url: '*'` entry would otherwise add a bare `*` rule and take every request the
  // browser makes off the proxy, while only port 443 is actually bridged.
  it('does not take all traffic off the proxy for a catch-all entry', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'

    const { proxyBypassList } = translateEgressPolicyToLaunchOpts(null, [{ hostname: '*', port: 443 }])

    expect(proxyBypassList).toBe('*:443')
  })

  it('does not repeat a bridged origin already covered by NO_PROXY or hosts', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'
    process.env.NO_PROXY = 'secure.example.com:443'

    expect(translateEgressPolicyToLaunchOpts({}, [{ hostname: 'secure.example.com', port: 443 }])).toStrictEqual({
      proxyServer: 'http://proxy.example:8080',
      proxyBypassList: 'secure.example.com:443',
    })
  })

  it('adds no bypass list for bridged origins when no proxy is configured', () => {
    expect(translateEgressPolicyToLaunchOpts(null, [{ hostname: 'secure.example.com', port: 443 }])).toStrictEqual({})
  })
})
