/// <reference types="cypress" />
import { mount } from '@cypress/vue'

Cypress.Commands.overwrite('mount', (fn, comp) => {
  return mount(comp)
})
