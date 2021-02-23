/// <reference types="cypress" />
import B from './B.vue'
import { mount, enableAutoDestroy } from '@cypress/vue'

describe('Hello', () => {
  enableAutoDestroy(beforeEach)
  it('shows error for short text', () => {
    cy.viewport(300, 200)
    mount(B)
    cy.wait(1200)
    cy.get('p').contains('Done')
  })

  it('shows error for more text', () => {
    cy.viewport(300, 200)
    mount(B, {
      propsData: {
        msg: 'Another'
      }
    })
    cy.wait(1200)
    cy.get('p').contains('Done')
  })

  it('shows error for more and more text', () => {
    cy.viewport(300, 200)
    mount(B, {
      propsData: {
        msg: 'Another'
      }
    })
    cy.wait(1200)
    cy.get('p').contains('Done')
  })
})