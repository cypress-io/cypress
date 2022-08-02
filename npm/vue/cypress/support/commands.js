/// <reference types="cypress" />
import { mount } from '@cypress/vue'

Cypress.Commands.add('mount', (comp) => {
  return mount(comp)
})
