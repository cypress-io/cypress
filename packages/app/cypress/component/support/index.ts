/// <reference path="../../../../frontend-shared/cypress/support/component.ts" />
import '../../../../frontend-shared/cypress/support/component.ts'
import { registerMountFn } from '@packages/frontend-shared/cypress/support/common'
// ***********************************************************
// This example support/index.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:

import '@iconify/iconify'
import { createRouter } from '../../../src/router/router'
import { createPinia } from '../../../src/store'
import { setActivePinia } from 'pinia'
import type { Pinia } from 'pinia'
import 'cypress-real-events/support'
import 'cypress-plugin-tab'

import { installCustomPercyCommand } from '@packages/frontend-shared/cypress/support/customPercyCommand'
import { tabUntil } from '@packages/frontend-shared/cypress/support/tab-until'

let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)

  cy.window().then((win) => {
    // Specify the platform on the config attached to window so that it is available during our component tests
    // For now, it is the only thing that we are referencing on the config
    // @ts-ignore
    win.__CYPRESS_CONFIG__ = {
      base64Config: Cypress.Buffer.from(JSON.stringify({ platform: Cypress.platform })).toString('base64'),
    }
  })
})

registerMountFn({ plugins: [() => createRouter(), () => pinia] })

installCustomPercyCommand()

Cypress.on('uncaught:exception', (err) => !err.message.includes('ResizeObserver loop limit exceeded'))
Cypress.Commands.add('tabUntil', tabUntil)
