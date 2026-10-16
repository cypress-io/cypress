/// <reference types="cypress" />

describe('downloads', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/downloads.html')
  })

  it('handles csv file download', () => {
    cy.get('[data-cy=download-csv]').click()
    cy
    // Must stay under the 2000ms proxy correlation timeout, or a correlation bug passes unnoticed.
    .readFile(`${Cypress.config('downloadsFolder')}/records.csv`, { timeout: 1500 })
    .should('contain', '"Joe","Smith"')
  })

  it('handles zip file download', () => {
    cy.get('[data-cy=download-zip]').click()
    // not worth adding a dependency to read contents, just ensure it's there
    // Must stay under the 2000ms proxy correlation timeout, or a correlation bug passes unnoticed.
    cy.readFile(`${Cypress.config('downloadsFolder')}/files.zip`, { timeout: 1500 })
  })

  it('handles xlsx file download', () => {
    cy.get('[data-cy=download-xlsx]').click()
    // not worth adding a dependency to read contents, just ensure it's there
    // Must stay under the 2000ms proxy correlation timeout, or a correlation bug passes unnoticed.
    cy.readFile(`${Cypress.config('downloadsFolder')}/people.xlsx`, { timeout: 1500 })
  })
})
