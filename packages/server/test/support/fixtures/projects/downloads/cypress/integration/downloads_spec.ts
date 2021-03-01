/// <reference types="cypress" />

describe('downloads', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/downloads.html')
  })

  it('handles csv file download', () => {
    cy.get('[data-cy=download-csv]').click()
    cy
    .readFile(`${Cypress.config('downloadsFolder')}/records.csv`)
    .should('contain', '"Joe","Smith"')
  })

  it('handles zip file download', () => {
    cy.get('[data-cy=download-zip]').click()
    // not worth adding a dependency to read contents, just ensure it's there
    cy.readFile(`${Cypress.config('downloadsFolder')}/files.zip`)
  })

  it('handles xlsx file download', () => {
    cy.get('[data-cy=download-xlsx]').click()
    // not worth adding a dependency to read contents, just ensure it's there
    cy.readFile(`${Cypress.config('downloadsFolder')}/people.xlsx`)
  })
})
