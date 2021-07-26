import { mount } from '@cypress/vue'
import { provideApolloClient } from '@vue/apollo-composable'
import { createStoreApp, StoreApp } from '../../src/store/app'
import { initGraphQLipc } from '../../src/graphql/graphqlIpc'
import { apolloClient } from '../../src/graphql/apolloClient'
import { createStoreConfig, StoreConfig } from '../../src/store/config'

/**
 * This variable is mimicing ipc provided by electron.
 * It has to be loaded run before initializing GraphQL
 * because graphql uses it.
 */
(window as any).ipc = {
  on: () => {},
  send: () => {},
}

initGraphQLipc()

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
    options.global.plugins.push({ install (app) {
      provideApolloClient(apolloClient)
    } })

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
