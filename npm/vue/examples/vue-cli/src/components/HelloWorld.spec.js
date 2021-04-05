import { mount } from '@cypress/vue'
import HelloWorld from './HelloWorld.vue'

describe('<Logo />', () => {
  it('contains an svg', () => {
    const slotContent = 'Welcome to component testing in CLI'

    mount(HelloWorld, {
      slots: {
        default: slotContent,
      },
    })

    cy.contains('h1', slotContent)
  })
})
