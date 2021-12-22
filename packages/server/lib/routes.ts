import httpProxy from 'http-proxy'
import Debug from 'debug'
import { ErrorRequestHandler, Router } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'

import type { SpecsStore } from './specs-store'
import type { Browser } from './browsers/types'
import type { NetworkProxy } from '@packages/proxy'
import type { Cfg } from './project-base'
import xhrs from './controllers/xhrs'
import { runner } from './controllers/runner'
import { iframesController } from './controllers/iframes'
import type { DataContext } from '@packages/data-context/src/DataContext'
import { getCtx } from '@packages/data-context'

const debug = Debug('cypress:server:routes')

export interface InitializeRoutes {
  ctx: DataContext
  specsStore: SpecsStore
  config: Cfg
  getSpec: () => Cypress.Spec | null
  getCurrentBrowser: () => Browser
  nodeProxy: httpProxy
  networkProxy: NetworkProxy
  getRemoteState: () => Cypress.RemoteState
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
  specsStore,
  getRemoteState,
  nodeProxy,
  ctx,
  exit,
}: InitializeRoutes) => {
  const router = Router()

  if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
    const proxy = httpProxy.createProxyServer({
      target: `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`,
    })

    router.get(`/__cypress/assets/*`, (req, res) => {
      proxy.web(req, res, {}, (e) => {})
    })
  } else {
    router.get(`/__cypress/assets/*`, (req, res) => {
      const pathToFile = getPathToDist('app', req.params[0])

      return send(req, pathToFile).pipe(res)
    })
  }

  const proxy = httpProxy.createProxyServer({
    target: `http://localhost:${getCtx().gqlServerPort}/graphql`,
  })

  router.all(`/${config.namespace}/graphql/*`, (req, res) => {
    proxy.web(req, res, {}, (e) => {})
  })

  // /__cypress/runner/*
  router.get(`/${config.namespace}/runner/*`, (req, res) => {
    runner.handle(testingType, req, res)
  })

  // /__cypress/xhrs/*
  router.all(`/${config.namespace}/xhrs/*`, (req, res, next) => {
    xhrs.handle(req, res, config, next)
  })

  // /__cypress/iframes/*
  router.get(`/${config.namespace}/iframes/*`, (req, res) => {
    if (testingType === 'e2e') {
      iframesController.e2e({ config, getSpec, getRemoteState }, req, res)
    }

    if (testingType === 'component') {
      iframesController.component({ config, nodeProxy }, req, res)
    }
  })

  const clientRoute = config.clientRoute

  if (!clientRoute) {
    throw Error(`clientRoute is required. Received ${clientRoute}`)
  }

  router.get(clientRoute, (req, res) => {
    debug('Serving Cypress front-end by requested URL:', req.url)

    if (process.env.LAUNCHPAD) {
      ctx.html.appHtml()
      .then((html) => res.send(html))
      .catch((e) => res.status(500).send({ stack: e.stack }))
    } else {
      runner.serve(req, res, testingType === 'e2e' ? 'runner' : 'runner-ct', {
        config,
        testingType,
        getSpec,
        getCurrentBrowser,
        getRemoteState,
        specsStore,
        exit,
      })
    }
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
