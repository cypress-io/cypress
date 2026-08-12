import { getGraphQLWsUrl } from './urqlClient'

describe('getGraphQLWsUrl', () => {
  const appConfig = {
    target: 'app',
    namespace: '__cypress',
    socketIoRoute: '/__socket',
    proxyUrl: 'http://localhost:2345',
  } as const

  it('uses the page origin when the proxy is enabled', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'http:', host: 'localhost:2345' }, false)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  it('uses wss when the page is served over https and the proxy is enabled', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'https:', host: 'app.foobar.com' }, false)

    expect(url).to.equal('wss://app.foobar.com/__socket-graphql')
  })

  it('uses the Cypress server origin when the proxy is disabled', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'http:', host: 'localhost:2292' }, true)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  it('uses the Cypress server origin when the proxy is disabled and the page is https', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'https:', host: 'app.foobar.com' }, true)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  it('falls back to the page origin when the proxy is disabled and no proxyUrl is served', () => {
    const url = getGraphQLWsUrl({ ...appConfig, proxyUrl: undefined }, { protocol: 'http:', host: 'localhost:2292' }, true)

    expect(url).to.equal('ws://localhost:2292/__socket-graphql')
  })

  it('always uses the page origin for launchpad', () => {
    const url = getGraphQLWsUrl({ target: 'launchpad' }, { protocol: 'http:', host: 'localhost:2345' }, true)

    expect(url).to.equal('ws://localhost:2345/__launchpad/graphql-ws')
  })
})
