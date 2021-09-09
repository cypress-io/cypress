import type httpProxy from 'http-proxy'
import type { Express } from 'express'

import type { SpecsStore } from './specs-store'
import type { Browser } from './browsers/types'
import type { NetworkProxy } from '@packages/proxy'
import type { Cfg } from './project-base'

export interface InitializeRoutes {
  app: Express
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

export const common = {
}
