/// <reference types="cypress" />
import { ErrorBoundary } from './error-boundary.jsx'
import React from 'react'
import { mount } from '@cypress/react'

Cypress.on('uncaught:exception', (err, runnable) => {
  return false
})

/* eslint-env mocha */
describe('Error Boundary', () => {
  const errorMessage = 'I crashed!'
  const ChildWithoutError = () => <h1>Normal Child</h1>
  const ChildWithError = () => {
    throw new Error(errorMessage)
  }

  it('renders normal children', () => {
    mount(
      <ErrorBoundary>
        <ChildWithoutError />
      </ErrorBoundary>,
    )

    cy.get('h1').should('have.text', 'Normal Child')
    cy.get(ErrorBoundary)
    .its('state.error')
    .should('not.exist')
  })

  it('on error, display fallback UI', () => {
    try {
      mount(
        <ErrorBoundary name="ChildWithError">
          <ChildWithError />
        </ErrorBoundary>,
      )
    } catch (e) {
      // do nothing
    }

    cy.get('header h1').should('contain', 'Something went wrong.')
    cy.get('header h3').should('contain', 'ChildWithError failed to load')
  })
})
