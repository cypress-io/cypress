import { ErrorBoundary } from '../../src/error-boundary.jsx'
import React from 'react'

/* eslint-env mocha */
describe('Error Boundary', () => {
  const errorMessage = 'I crashed!'
  const ChildWithoutError = () => <h1>Normal Child</h1>
  const ChildWithError = () => {
    throw new Error(errorMessage)
    return null
  }

  it('renders normal children', () => {
    cy.mount(
      <ErrorBoundary>
        <ChildWithoutError />
      </ErrorBoundary>
    )
    cy.get('h1')
      .should('have.text', 'Normal Child')
    cy.get('@Component')
      .its('state.error')
      .should('not.exist')
  })

  it('on error, display fallback UI', () => {
    cy.mount(
      <ErrorBoundary>
        <ChildWithError />
      </ErrorBoundary>
    )
    cy.get('header h1')
      .should('contain', 'Something went wrong.')
    cy.get('header h3')
      .should('contain', 'failed to load')
    cy.get('@Component')
      .its('state.error.message')
      .should('equal', errorMessage)
    cy.get('@Component')
      .its('state.error.stack')
      .should('contain', 'ChildWithError')
  })
})