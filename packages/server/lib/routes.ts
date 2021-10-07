import httpProxy from 'http-proxy'
import { ErrorRequestHandler, Router } from 'express'
import send from 'send'

import type { SpecsStore } from './specs-store'
import type { Browser } from './browsers/types'
import type { NetworkProxy } from '@packages/proxy'
import type { Cfg } from './project-base'
import xhrs from './controllers/xhrs'
import { runner } from './controllers/runner'
import { iframesController } from './controllers/iframes'
import { getPathToDist } from '@packages/resolve-dist'
import Debug from 'debug'

const debug = Debug('cypress:server:routes')

export interface InitializeRoutes {
  specsStore: SpecsStore
  config: Cfg
  getSpec: () => Cypress.Spec | null
  getCurrentBrowser: () => Browser
  nodeProxy: httpProxy
  networkProxy: NetworkProxy
  getRemoteState: () => Cypress.RemoteState
  onError: (...args: unknown[]) => any
  testingType: Cypress.TestingType
}

export const createCommonRoutes = ({
  config,
  networkProxy,
  testingType,
  getSpec,
  getRemoteState,
  nodeProxy,
}: InitializeRoutes) => {
  const router = Router()

  router.get('/__cypress/runner/*', (req, res) => {
    runner.handle(testingType, req, res)
  })

  router.all('/__cypress/xhrs/*', (req, res, next) => {
    xhrs.handle(req, res, config, next)
  })

  router.get('/__cypress/iframes/*', (req, res) => {
    if (testingType === 'e2e') {
      iframesController.e2e({ config, getSpec, getRemoteState }, req, res)
    }

    if (testingType === 'component') {
      iframesController.component({ config, nodeProxy }, req, res)
    }
  })

  if (process.env.CYPRESS_INTERNAL_VITE_APP_PORT) {
    const webProxy = httpProxy.createProxyServer({
      target: `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`,
    })

    // TODO: can namespace this onto a "unified" route like __app-unified__
    // make sure to update the generated routes inside of vite.config.ts
    router.get('/__vite__/*', (req, res) => {
      debug('Proxy to __vite__')
      webProxy.web(req, res, {}, (e) => {
        debug('error proxying request to %s. error %s', req.url, e.message)
      })
    })
  } else {
    router.get('/__vite__/*', (req, res) => {
      debug(`serving dist'd app via __vite__/*`)
      const pathToFile = getPathToDist('app', req.params[0])

      return send(req, pathToFile).pipe(res)
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
