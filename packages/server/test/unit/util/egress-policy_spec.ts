import '../../spec_helper'
import { translateEgressPolicyToLaunchOpts } from '../../../lib/util/egress-policy'

describe('lib/util/egress-policy', () => {
  const originalEnv = {
    HTTP_PROXY: process.env.HTTP_PROXY,
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    NO_PROXY: process.env.NO_PROXY,
    http_proxy: process.env.http_proxy,
    https_proxy: process.env.https_proxy,
    no_proxy: process.env.no_proxy,
  }

  beforeEach(() => {
    delete process.env.HTTP_PROXY
    delete process.env.HTTPS_PROXY
    delete process.env.NO_PROXY
    delete process.env.http_proxy
    delete process.env.https_proxy
    delete process.env.no_proxy
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

  it('uses HTTP_PROXY with the default loopback bypass', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'

    expect(translateEgressPolicyToLaunchOpts()).to.deep.equal({
      proxyServer: 'http://proxy.example:8080',
      proxyBypassList: '<-loopback>,127.0.0.1,::1,localhost',
    })
  })

  it('preserves distinct HTTP_PROXY and HTTPS_PROXY rules', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'
    process.env.HTTPS_PROXY = 'http://secure-proxy.example:8443'
    process.env.NO_PROXY = 'localhost,example.com'

    expect(translateEgressPolicyToLaunchOpts()).to.deep.equal({
      proxyServer: 'http=http://proxy.example:8080;https=http://secure-proxy.example:8443',
      proxyBypassList: '<-loopback>,localhost,example.com,127.0.0.1,::1',
    })
  })

  it('does not duplicate the loopback marker', () => {
    process.env.HTTP_PROXY = 'http://proxy.example:8080'
    process.env.NO_PROXY = 'localhost,<-loopback>,example.com'

    expect(translateEgressPolicyToLaunchOpts()).to.deep.equal({
      proxyServer: 'http://proxy.example:8080',
      proxyBypassList: 'localhost,<-loopback>,example.com',
    })
  })

  it('keeps loopback direct when only HTTPS_PROXY is set', () => {
    process.env.HTTPS_PROXY = 'http://secure-proxy.example:8443'

    expect(translateEgressPolicyToLaunchOpts()).to.deep.equal({
      proxyServer: 'https=http://secure-proxy.example:8443',
      proxyBypassList: '<-loopback>,127.0.0.1,::1,localhost',
    })
  })

  it('honors lowercase proxy environment variables', () => {
    process.env.http_proxy = 'http://proxy.example:8080'
    process.env.no_proxy = 'example.com'

    expect(translateEgressPolicyToLaunchOpts()).to.deep.equal({
      proxyServer: 'http://proxy.example:8080',
      proxyBypassList: '<-loopback>,example.com,127.0.0.1,::1,localhost',
    })
  })
})
