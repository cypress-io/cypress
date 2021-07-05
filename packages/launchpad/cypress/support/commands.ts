import { mount } from '@cypress/vue'
import { VClickOutside } from '../../src/plugins/ClickOutside'
import { createStoreApp, StoreApp } from '../../src/store/app'
import { createStoreConfig, StoreConfig } from '../../src/store/config'

Cypress.Commands.add(
  'mount',
  (comp: Parameters<typeof mount>[0], options: Parameters<typeof mount>[1]) => {
    const storeApp = createStoreApp()
    const storeConfig = createStoreConfig()

    storeConfig.setStoreApp(storeApp)

    Cypress.storeApp = storeApp
    Cypress.storeConfig = storeConfig

    options = options || {}
    options.global = options.global || {}

    options.global.directives = options.global.directives || {}
    options.global.directives['click-outside'] = VClickOutside

    options.global.plugins = options.global.plugins || []
    options.global.plugins.push(storeApp)
    options.global.plugins.push(storeConfig)

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
      storeApp: StoreApp
      storeConfig: StoreConfig
    }
  }
}
