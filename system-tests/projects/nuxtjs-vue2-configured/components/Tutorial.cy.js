import { mount } from '@cypress/vue'
import Tutorial from './Tutorial.vue'

it('works', () => {
  mount(Tutorial)
  cy.contains('Nuxt')
})