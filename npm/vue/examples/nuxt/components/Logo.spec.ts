import { mount } from '@cypress/vue'
import Logo from './Logo.vue'

describe('<Logo />', () => {
  it('contains an svg', () => {
    mount(Logo)
    cy.get('svg').should('be.visible')
  })
})
