/// <reference path="../../cli/types/chai-jquery/index.d.ts" />
/// <reference path="../../cli/types/sinon-chai/index.d.ts" />
/// <reference path="../../cli/types/cypress-expect.d.ts" />

/// <reference path="../ts/index.d.ts" />

declare global {
  interface Window {
    Cypress: Cypress.Cypress
  }
}

import $Cypress from './src/main'

export default $Cypress

export * from './src/main'
