import React from 'react'
import { StudioTestHeader, TestActions } from './StudioTestHeader'

describe('StudioTestHeader', () => {
  let mockSpec: Cypress.Cypress['spec']

  beforeEach(() => {
    // Mock the spec
    mockSpec = {
      name: 'cypress/e2e/example.cy.ts',
      relative: 'cypress/e2e/example.cy.ts',
      absolute: '/Users/test/cypress/e2e/example.cy.ts',
    } as Cypress.Cypress['spec']

    cy.stub(TestActions, 'handleBackButton').as('handleBackButton')
  })

  it('renders studio header with spec information', () => {
    cy.mount(
      <StudioTestHeader
        spec={mockSpec}
      />,
    )

    cy.get('.studio-header').should('be.visible')
    cy.get('.studio-header__file-section').should('be.visible')
    cy.get('.studio-header__file-content').should('be.visible')
    cy.get('[data-cy="studio-single-test-file-name"]').should('contain.text', 'example.cy.ts')
    cy.get('[data-cy="studio-back-button"]').should('be.visible')
    cy.percySnapshot()
  })

  it('handles back button click', () => {
    cy.mount(
      <StudioTestHeader
        spec={mockSpec}
      />,
    )

    cy.get('[data-cy="studio-back-button"]').click()
    cy.get('@handleBackButton').should('have.been.called')
  })
})
