/// <reference types="cypress" />

declare global {
  interface Window {
    Cypress: Cypress.Cypress
  }
}

import $Cypress from './src/main'

export default $Cypress

export * from './src/main'
