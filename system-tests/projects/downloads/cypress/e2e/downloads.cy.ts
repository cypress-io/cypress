/// <reference types="cypress" />

describe('downloads', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/downloads.html')
  })

  it('handles csv file download', () => {
    cy.get('[data-cy=download-csv]').click()
    cy
    // Note that this timeout is less than the proxy correlation timeout. It needs to be less than that timeout
    // to ensure that we don't paper over a bug in the proxy correlation logic.
    .readFile(`${Cypress.config('downloadsFolder')}/records.csv`, { timeout: 1000 })
    .should('contain', '"Joe","Smith"')
  })

  it('handles zip file download', () => {
    cy.get('[data-cy=download-zip]').click()
    // not worth adding a dependency to read contents, just ensure it's there
    // Note that this timeout is less than the proxy correlation timeout. It needs to be less than that timeout
    // to ensure that we don't paper over a bug in the proxy correlation logic.
    cy.readFile(`${Cypress.config('downloadsFolder')}/files.zip`, { timeout: 1000 })
  })

  it('handles xlsx file download', () => {
    cy.get('[data-cy=download-xlsx]').click()
    // not worth adding a dependency to read contents, just ensure it's there
    // Note that this timeout is less than the proxy correlation timeout. It needs to be less than that timeout
    // to ensure that we don't paper over a bug in the proxy correlation logic.
    cy.readFile(`${Cypress.config('downloadsFolder')}/people.xlsx`, { timeout: 1000 })
  })
})
