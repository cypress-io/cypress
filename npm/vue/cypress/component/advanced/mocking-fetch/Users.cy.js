/// <reference types="cypress" />
import { mount } from '@cypress/vue'
import Users from './Users.vue'

describe('Fetching users', () => {
  let mockUsers

  before(() => {
    // load the mock user list once from cypress/fixtures/users.json
    cy.fixture('users').then((list) => {
      expect(list).to.have.length(2)
      mockUsers = list
    })
  })

  it('renders real data', () => {
    mount(Users)
    cy.get('.user').should('have.length', 3)
  })

  it('can mock window.fetch method', () => {
    cy.stub(window, 'fetch').resolves({
      json: cy.stub().resolves(mockUsers),
    })

    mount(Users)
    cy.get('.user').should('have.length', mockUsers.length)
    cy.get('.user')
    .first()
    .should('have.text', `${mockUsers[0].id} - ${mockUsers[0].name}`)
  })

  it('shows loading UI while fetch is happening', () => {
    const mockResponse = {
      json: cy.stub().resolves(mockUsers),
    }

    cy.stub(window, 'fetch').resolves(
      // resolve promise after a delay
      Cypress.Promise.resolve(mockResponse).delay(1000),
    )

    mount(Users)
    cy.get('.loading').should('be.visible')
    cy.get('.loading').should('not.exist')

    cy.get('.user').should('have.length', mockUsers.length)
    cy.get('.user')
    .first()
    .should('have.text', `${mockUsers[0].id} - ${mockUsers[0].name}`)
  })
})
