import { mount } from '@cypress/vue'
import 'windi.css'

import SelectFramework from '../../src/components/SelectFramework.vue'
import { createStore } from '../../src/store'

describe('<SelectFramework />', () => {
  it('display an image of vue only when vue is selected', () => {
    const store = createStore()

    mount(SelectFramework, {
      global: {
        plugins: [store],
      },
    })

    cy.get('select').select('3')
  })
})
