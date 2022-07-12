/// <reference types="cypress" />

describe('downloads', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/downloads.html')
  })

  it('downloads cvs file', () => {
    cy.get('[data-cy=download-csv]').click()
  })
})
