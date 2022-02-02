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

import 'virtual:windi.css'
import '../../../src/main.scss'
import '@iconify/iconify'
import { createRouter } from '../../../src/router/router'
import { createPinia } from '../../../src/store'
import { Pinia, setActivePinia } from 'pinia'
import 'cypress-real-events/support'
import installCustomPercyCommand from '@packages/ui-components/cypress/support/customPercyCommand'

let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

registerMountFn({ plugins: [() => createRouter(), () => pinia] })

installCustomPercyCommand()

Cypress.on('uncaught:exception', (err) => !err.message.includes('ResizeObserver loop limit exceeded'))
