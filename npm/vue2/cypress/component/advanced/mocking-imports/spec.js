/// <reference types="cypress" />
import Hello from './Hello.vue'
import { mount } from '@cypress/vue'
import * as GreetingModule from './greeting'

describe('Mocking ES6 imports', () => {
  beforeEach(() => {
    cy.viewport(300, 200)
  })

  it('shows real greeting without mocking', () => {
    mount(Hello)
    cy.contains('Hello, world!')
  })

  it('shows mocked greeting', () => {
    cy.stub(GreetingModule, 'greeting').returns('Cypress').as('greeting')
    mount(Hello)
    cy.contains('Hello, Cypress!')
    // confirm the stub was called
    cy.get('@greeting').should('have.been.calledOnce')
  })

  it('resets the original import', () => {
    mount(Hello)
    cy.contains('Hello, world!')
  })
})
