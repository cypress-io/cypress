import { mount } from 'cypress/vue2'
import Tutorial from './Tutorial.vue'

it('works', () => {
  mount(Tutorial)
  cy.contains('Nuxt')
})
