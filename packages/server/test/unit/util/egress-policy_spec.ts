import '../../spec_helper'
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

  after(() => {
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

    expect(translateEgressPolicyToLaunchOpts()).to.deep.equal({})
  })

  it('leaves the bypass list off so implicit loopback rules apply', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'

    expect(translateEgressPolicyToLaunchOpts()).to.deep.equal({
      proxyServer: 'http://proxy.example:8080',
    })
  })

  it('preserves distinct HTTP_PROXY and HTTPS_PROXY rules', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'
    process.env.HTTPS_PROXY = 'http://secure-proxy.example:8443'
    process.env.NO_PROXY = 'localhost, example.com'

    expect(translateEgressPolicyToLaunchOpts()).to.deep.equal({
      proxyServer: 'http=http://proxy.example:8080;https=http://secure-proxy.example:8443',
      proxyBypassList: 'localhost,example.com',
    })
  })

  it('maps HTTPS_PROXY to the https scheme when HTTP_PROXY is unset', () => {
    process.env.HTTPS_PROXY = 'http://secure-proxy.example:8443'

    expect(translateEgressPolicyToLaunchOpts()).to.deep.equal({
      proxyServer: 'https=http://secure-proxy.example:8443',
    })
  })

  it('drops <-loopback> so the browser can reach the cypress server', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'
    process.env.NO_PROXY = 'localhost,<-loopback>,example.com'

    expect(translateEgressPolicyToLaunchOpts()).to.deep.equal({
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
    })).to.deep.equal({
      proxyServer: 'http://proxy.example:8080',
      proxyBypassList: 'example.com,*.foobar.com',
    })
  })
})
