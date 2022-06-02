import { mount } from 'cypress/vue'
import HelloWorld from './HelloWorld.vue'

describe('<Logo />', () => {
  it('contains the default slot in its h1', () => {
    const slotContent = 'Welcome to testing in Vue CLI'

    mount(HelloWorld, {
      propsData: {
        msg: slotContent,
      },
    })

    cy.contains('h1', slotContent)
  })
})
