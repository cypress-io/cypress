import type httpProxy from 'http-proxy'
import { ErrorRequestHandler, Router } from 'express'

import type { SpecsStore } from './specs-store'
import type { Browser } from './browsers/types'
import type { NetworkProxy } from '@packages/proxy'
import type { Cfg } from './project-base'
import xhrs from './controllers/xhrs'
import { runner } from './controllers/runner'
import { iframesController } from './controllers/iframes'

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
