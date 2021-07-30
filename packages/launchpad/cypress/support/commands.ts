import { mount } from '@cypress/vue'
import { provideClient } from '@urql/vue'
import { createStoreApp, StoreApp } from '../../src/store/app'
import { createStoreConfig, StoreConfig } from '../../src/store/config'
import { testApolloClient } from './testApolloClient'
import { ClientTestContext } from '@packages/server/lib/graphql/context/ClientTestContext'

/**
 * This variable is mimicing ipc provided by electron.
 * It has to be loaded run before initializing GraphQL
 * because graphql uses it.
 */
(window as any).ipc = {
  on: () => {},
  send: () => {},
}

Cypress.Commands.add(
  'mount',
  (comp: Parameters<typeof mount>[0], options: Parameters<typeof mount>[1]) => {
    const storeApp = createStoreApp()
    const storeConfig = createStoreConfig(storeApp)

    Cypress.storeApp = storeApp
    Cypress.storeConfig = storeConfig

    options = options || {}
    options.global = options.global || {}

    options.global.plugins = options.global.plugins || []
    options.global.plugins.push(storeApp)
    options.global.plugins.push(storeConfig)
    options.global.plugins.push({
      install (app) {
        provideClient(testApolloClient(new ClientTestContext()))
      },
    })

    return mount(comp, options)
  },
)

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Install all vue plugins and globals then mount
       */
      mount: typeof mount
    }
    interface Cypress {
      /**
       * The sroreApp used in the mount command
       */
      storeApp: StoreApp
      /**
       * The sroreConfig used in the mount command
       */
      storeConfig: StoreConfig
    }
  }
}
