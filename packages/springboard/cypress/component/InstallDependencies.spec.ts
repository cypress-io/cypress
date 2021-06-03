import { mount } from '@cypress/vue'
import 'windi.css'

import InstallDependencies from '../../src/components/InstallDependencies.vue'
import { frameworks } from '../../src/supportedFrameworks'
import { createStore } from '../../src/store'

describe('InstallDependencies', () => {
  before(() => {
    cy.viewport(1000, 500)
  })

  it('does not render previous button on first step', () => {
    const store = createStore({
      testingType: 'component',
      component: {
        framework: frameworks[0],
      },
    })

    mount(InstallDependencies, {
      global: {
        plugins: [
          store,
        ],
      },
    })
  })
})
