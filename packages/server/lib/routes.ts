import type httpProxy from 'http-proxy'
import { Router } from 'express'

import type { SpecsStore } from './specs-store'
import type { Browser } from './browsers/types'
import type { NetworkProxy } from '@packages/proxy'
import type { Cfg } from './project-base'
import xhrs from './controllers/xhrs'

export interface InitializeRoutes {
  specsStore: SpecsStore
  config: Cfg
  getSpec: () => Cypress.Cypress['spec'] | null
  getCurrentBrowser: () => Browser
  nodeProxy: httpProxy
  networkProxy: NetworkProxy
  getRemoteState: () => any
  onError: (...args: unknown[]) => any
  testingType: Cypress.Cypress['testingType']
}

export const createCommonRoutes = ({
  config,
  specsStore,
  getRemoteState,
  networkProxy,
  getSpec,
  getCurrentBrowser,
  onError,
  testingType,
}: InitializeRoutes) => {
  const router = Router()

  router.all('/__cypress/xhrs/*', (req, res, next) => {
    xhrs.handle(req, res, config, next)
  })

  return router
}
