import '../../src/main'
import { mount } from '@cypress/vue'
import { h } from 'vue'
import DebugRenderer from './DebugRenderer.vue'

Cypress.Commands.add('debugMount', (content) => {
  cy.viewport(600, 1000)
  mount(DebugRenderer, {
    slots: {
      default() {
        return JSON.stringify(content, null, 2)
      }
  }})
})