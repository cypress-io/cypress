import { getGraphQLWsUrl } from './urqlClient'

describe('getGraphQLWsUrl', () => {
  const appConfig = {
    target: 'app',
    namespace: '__cypress',
    socketIoRoute: '/__socket',
    port: 2345,
  } as const

  it('uses the page origin when the proxy is enabled', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'http:', host: 'localhost:2345' }, false)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  it('uses wss when the page is served over https and the proxy is enabled', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'https:', host: 'app.foobar.com' }, false)

    expect(url).to.equal('wss://app.foobar.com/__socket-graphql')
  })

  it('uses the Cypress server port when the proxy is disabled', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'http:', host: 'localhost:2292' }, true)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  it('uses the Cypress server port when the proxy is disabled and the page is https', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'https:', host: 'app.foobar.com' }, true)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  // proxyUrl is derived from the port that was requested and can name a port nothing is
  // bound to, so the served `port` is the only reliable source for the handshake
  it('ignores a proxyUrl that disagrees with the served port', () => {
    const url = getGraphQLWsUrl({ ...appConfig, proxyUrl: 'http://localhost:9999' } as any, { protocol: 'http:', host: 'localhost:2292' }, true)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  it('falls back to the page origin when the proxy is disabled and no port is served', () => {
    const url = getGraphQLWsUrl({ ...appConfig, port: undefined }, { protocol: 'http:', host: 'localhost:2292' }, true)

    expect(url).to.equal('ws://localhost:2292/__socket-graphql')
  })

  it('always uses the page origin for launchpad', () => {
    const url = getGraphQLWsUrl({ target: 'launchpad' }, { protocol: 'http:', host: 'localhost:2345' }, true)

    expect(url).to.equal('ws://localhost:2345/__launchpad/graphql-ws')
  })
})
