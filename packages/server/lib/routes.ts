import httpProxy from 'http-proxy'
import Debug from 'debug'
import { ErrorRequestHandler, Request, Router } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'
import { getRoutesForRequest } from '@packages/net-stubbing'

import type { NetworkProxy } from '@packages/proxy'
import type { Cfg } from './project-base'
import xhrs from './controllers/xhrs'
import { runner } from './controllers/runner'
import { iframesController, proxyRequestToDevServer } from './controllers/iframes'
import type { FoundSpec } from '@packages/types'
import { getCtx } from '@packages/data-context'
import { graphQLHTTP } from '@packages/graphql/src/makeGraphQLServer'
import type { RemoteStates } from './remote_states'
import type { NetStubbingState } from '@packages/net-stubbing/lib/server'
import type { IncomingHttpHeaders } from 'http'

const debug = Debug('cypress:server:routes')

export interface InitializeRoutes {
  config: Cfg
  getSpec: () => FoundSpec | null
  nodeProxy: httpProxy
  networkProxy: NetworkProxy
  remoteStates: RemoteStates
  onError: (...args: unknown[]) => any
  testingType: Cypress.TestingType
  netStubbingState: NetStubbingState
}

export const createCommonRoutes = ({
  config,
  networkProxy,
  testingType,
  getSpec,
  remoteStates,
  nodeProxy,
  netStubbingState,
}: InitializeRoutes) => {
  const router = Router()
  const { clientRoute, namespace } = config

  if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
    const proxy = httpProxy.createProxyServer({
      target: `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`,
    })

    router.get('/__cypress/assets/*', (req, res) => {
      proxy.web(req, res, {}, (e) => {})
    })
  } else {
    router.get('/__cypress/assets/*', (req, res) => {
      const pathToFile = getPathToDist('app', req.params[0])

      return send(req, pathToFile).pipe(res)
    })
  }

  router.use(`/${namespace}/graphql/*`, graphQLHTTP)

  router.get(`/${namespace}/runner/*`, (req, res) => {
    runner.handle(req, res)
  })

  router.all(`/${namespace}/xhrs/*`, (req, res, next) => {
    xhrs.handle(req, res, config, next)
  })

  router.get(`/${namespace}/iframes/*`, (req, res) => {
    if (testingType === 'e2e') {
      iframesController.e2e({ config, getSpec, remoteStates }, req, res)
    }

    if (testingType === 'component') {
      iframesController.component({ config, nodeProxy }, req, res)
    }
  })

  if (!clientRoute) {
    throw Error(`clientRoute is required. Received ${clientRoute}`)
  }

  router.get(clientRoute, (req: Request & { proxiedUrl?: string }, res) => {
    const nonProxied = req.proxiedUrl?.startsWith('/') ?? false

    // Chrome plans to make document.domain immutable in Chrome 109, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // so that we can continue to support tests that visit multiple subdomains in a single spec.
    // https://github.com/cypress-io/cypress/issues/20147
    res.setHeader('Origin-Agent-Cluster', '?0')

    getCtx().html.appHtml(nonProxied)
    .then((html) => res.send(html))
    .catch((e) => res.status(500).send({ stack: e.stack }))
  })

  // serve static assets from the dist'd Vite app
  router.get([
    `${clientRoute}assets/*`,
    `${clientRoute}shiki/*`,
  ], (req, res) => {
    debug('proxying static assets %s, params[0] %s', req.url, req.params[0])
    const pathToFile = getPathToDist('app', 'assets', req.params[0])

    return send(req, pathToFile).pipe(res)
  })

  const matchesNetStubbingRoute = (url: string, method: string, headers: IncomingHttpHeaders) => {
    const proxiedReq = {
      proxiedUrl: url,
      headers,
      method,
      // TODO: add `body` here once bodies can be statically matched
    }

    // @ts-ignore
    const iterator = getRoutesForRequest(netStubbingState?.routes, proxiedReq)
    // If the iterator is exhausted (done) on the first try, then 0 matches were found
    const zeroMatches = iterator.next().done

    return !zeroMatches
  }

  if (testingType === 'component') {
    router.get('*', (req, res) => {
      const isCyInterceptReq = matchesNetStubbingRoute(req.url, req.method, req.headers)

      // If it's not a request a route or asset served by the user's own app,
      // or it's a request that the user wants to intercept via `cy.intercept`
      // carry on as usual.
      if (req.hostname !== 'localhost' || isCyInterceptReq) {
        networkProxy.handleHttpRequest(req, res)
      } else {
        /**
         * This is a work-around for issues such where we cannot handle the routing
         * of asset requests in the same way as a some development environments expect.
         * This is usually because some frameworks and templates (eg Angular) do not
         * expose certain internal configuration variables.
         * We only proxy requests made to localhost, eg `/assets/foo.png, and not things like
         * http://some-real-cdn.com/foo.png.
         * Rather than fix it on a case-by-case basis, we just forward all traffic to the user's
         * dev server and let their underlying configuration handle it.
         * Anything else continues through the usual network proxy.
         * @see https://github.com/cypress-io/cypress/issues/24272
         */
        const proxyToDevServer = `${config.devServerPublicPathRoute}${req.url}`

        req.url = proxyToDevServer
        proxyRequestToDevServer(nodeProxy)(req, res)
      }
    })
  }

  router.all('*', (req, res) => {
    networkProxy.handleHttpRequest(req, res)
  })

  // when we experience uncaught errors
  // during routing just log them out to
  // the console and send 500 status
  // and report to raygun (in production)
  const errorHandlingMiddleware: ErrorRequestHandler = (err, req, res) => {
    console.log(err.stack) // eslint-disable-line no-console

    res.set('x-cypress-error', err.message)
    res.set('x-cypress-stack', JSON.stringify(err.stack))

    res.sendStatus(500)
  }

  router.use(errorHandlingMiddleware)

  return router
}
