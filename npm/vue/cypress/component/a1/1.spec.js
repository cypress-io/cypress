/// <reference types="cypress" />
import A from './A.vue'
import { mount, enableAutoDestroy } from '@cypress/vue'


describe('Hello', () => {

  enableAutoDestroy(beforeEach)

  it('shows error for short text', () => {
    cy.viewport(300, 200)
    mount(A)
    cy.wait(1000)
  })

  it('shows error for short text', () => {
    cy.viewport(300, 200)
    mount(A)
    cy.wait(1000)
  })
})
