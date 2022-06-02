import httpProxy from 'http-proxy'
import { ErrorRequestHandler, Request, Router } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'

import type { Browser } from './browsers/types'
import type { NetworkProxy } from '@packages/proxy'
import type { Cfg } from './project-base'
import xhrs from './controllers/xhrs'
import { runner } from './controllers/runner'
import { iframesController } from './controllers/iframes'
import type { FoundSpec } from '@packages/types'
import { getCtx } from '@packages/data-context'
import { graphQLHTTP } from '@packages/graphql/src/makeGraphQLServer'
import type { RemoteStates } from './remote_states'

export interface InitializeRoutes {
  config: Cfg
  getSpec: () => FoundSpec | null
  getCurrentBrowser: () => Browser
  nodeProxy: httpProxy
  networkProxy: NetworkProxy
  remoteStates: RemoteStates
  onError: (...args: unknown[]) => any
  testingType: Cypress.TestingType
  exit?: boolean
}

export const createCommonRoutes = ({
  config,
  networkProxy,
  testingType,
  getSpec,
  getCurrentBrowser,
  remoteStates,
  nodeProxy,
  exit,
}: InitializeRoutes) => {
  const router = Router()
  const { clientRoute, namespace } = config

  const makeAppRoutes = (routes: string[]) => {
    if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
      const viteProxy = httpProxy.createProxyServer({
        target: `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`,
      })

      return routes.forEach((route) => {
        router.get(route, (req, res) => {
          viteProxy.web(req, res, {}, (e) => {})
        })
      })
    }

    return routes.forEach((route) => {
      router.get(route, (req, res) => {
        const pathToFile = getPathToDist('app', req.params[0])

        return send(req, pathToFile).pipe(res)
      })
    })
  }

  // we need to make the dynamic routes but also
  // the static __cypress/app routes because we
  // generate vite assets at build time, not runtime
  // and vite is currently hard coded to generate
  // assets using __cypress/app as the asset base
  makeAppRoutes([`/${namespace}/app/*`, `/__cypress/app/*`])

  router.use(`/${namespace}/graphql/*`, graphQLHTTP)

  router.get(`/${namespace}/runner/*`, (req, res) => {
    runner.handle(testingType, req, res)
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

    // Chrome plans to make document.domain immutable in Chrome 106, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // so that we can continue to support tests that visit multiple subdomains in a single spec.
    // https://github.com/cypress-io/cypress/issues/20147
    res.setHeader('Origin-Agent-Cluster', '?0')

    getCtx().html.appHtml(nonProxied)
    .then((html) => res.send(html))
    .catch((e) => res.status(500).send({ stack: e.stack }))
  })

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
