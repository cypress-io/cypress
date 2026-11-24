import { createClient, gql, makeResult } from '@urql/core'
import type { Exchange, Operation, OperationResult } from '@urql/core'
import { empty, makeSubject, merge, mergeMap, onPush, pipe, subscribe } from 'wonka'
import type { Source } from 'wonka'
import { getGraphQLWsUrl, makeCacheExchange } from './urqlClient'

describe('makeCacheExchange', () => {
  const BrowserStatusQuery = gql`
    query BrowserStatusQuery {
      currentProject { id browserStatus }
    }
  `

  const BrowserStatusSubscription = gql`
    subscription BrowserStatusSubscription {
      browserStatusChange { id browserStatus }
    }
  `

  const PendingQuery = gql`
    query PendingQuery {
      isGlobalMode
    }
  `

  const project = (browserStatus: string) => ({ __typename: 'CurrentProject', id: 'project-id', browserStatus })
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

  function makeTestClient () {
    const forwarded: Operation[] = []
    const results = makeSubject<OperationResult>()

    const network: Exchange = () => {
      return (ops$) => {
        return merge([
          pipe(ops$, onPush((op) => op.kind !== 'teardown' && forwarded.push(op)), mergeMap((): Source<OperationResult> => empty)),
          results.source,
        ])
      }
    }

    const client = createClient({ url: 'http://localhost/graphql', exchanges: [makeCacheExchange(), network] })

    const lastForwarded = (operationName: string) => {
      return forwarded.filter((op) => (op.query.definitions[0] as any).name.value === operationName).pop()!
    }

    return { client, lastForwarded, respond: (op: Operation, data: object) => results.next(makeResult(op, { data })) }
  }

  it('applies a subscription result over an older query result while another query is in flight', async () => {
    const { client, lastForwarded, respond } = makeTestClient()
    const statuses: string[] = []

    pipe(client.subscription(BrowserStatusSubscription), subscribe(() => {}))
    pipe(client.query(BrowserStatusQuery, {}), subscribe((result) => result.data && statuses.push(result.data.currentProject.browserStatus)))
    await tick()

    respond(lastForwarded('BrowserStatusQuery'), { currentProject: project('closed') })
    pipe(client.query(PendingQuery, {}), subscribe(() => {}))
    await tick()

    respond(lastForwarded('BrowserStatusSubscription'), { browserStatusChange: project('opening') })
    await tick()

    const refetch = lastForwarded('BrowserStatusQuery')

    client.reexecuteOperation(client.createRequestOperation('query', refetch, { requestPolicy: 'network-only' }))
    await tick()

    respond(lastForwarded('BrowserStatusQuery'), { currentProject: project('opening') })
    await tick()

    respond(lastForwarded('BrowserStatusSubscription'), { browserStatusChange: project('open') })
    await tick()

    expect(statuses[statuses.length - 1]).to.equal('open')
  })
})

describe('getGraphQLWsUrl', () => {
  const appConfig = {
    target: 'app',
    namespace: '__cypress',
    socketIoRoute: '/__socket',
    port: 2345,
  } as const

  it('uses the page origin on the MITM proxy network path', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'http:', host: 'localhost:2345' }, false)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  it('uses wss when the page is served over https on the MITM proxy network path', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'https:', host: 'app.foobar.com' }, false)

    expect(url).to.equal('wss://app.foobar.com/__socket-graphql')
  })

  it('uses the Cypress server port on the browser (CDP) network path', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'http:', host: 'localhost:2292' }, true)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  it('uses the Cypress server port on the browser (CDP) network path when the page is https', () => {
    const url = getGraphQLWsUrl(appConfig, { protocol: 'https:', host: 'app.foobar.com' }, true)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  // proxyUrl is derived from the port that was requested and can name a port nothing is
  // bound to, so the served `port` is the only reliable source for the handshake
  it('ignores a proxyUrl that disagrees with the served port', () => {
    const url = getGraphQLWsUrl({ ...appConfig, proxyUrl: 'http://localhost:9999' } as any, { protocol: 'http:', host: 'localhost:2292' }, true)

    expect(url).to.equal('ws://localhost:2345/__socket-graphql')
  })

  it('falls back to the page origin on the browser (CDP) network path when no port is served', () => {
    const url = getGraphQLWsUrl({ ...appConfig, port: undefined }, { protocol: 'http:', host: 'localhost:2292' }, true)

    expect(url).to.equal('ws://localhost:2292/__socket-graphql')
  })

  it('always uses the page origin for launchpad', () => {
    const url = getGraphQLWsUrl({ target: 'launchpad' }, { protocol: 'http:', host: 'localhost:2345' }, true)

    expect(url).to.equal('ws://localhost:2345/__launchpad/graphql-ws')
  })
})
