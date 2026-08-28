/// <reference types="cypress" />

// A download the proxy fails to correlate arrives late rather than not at all, so a
// wall-clock budget here would race the machine rather than assert on correlation.
// system-tests/test/downloads_spec.ts asserts on the correlation itself, leaving these
// waits to do nothing but outlast a slow container.
const downloadTimeout = 10000

describe('downloads', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/downloads.html')
  })

  it('handles csv file download', () => {
    cy.get('[data-cy=download-csv]').click()
    cy.readFile(`${Cypress.config('downloadsFolder')}/records.csv`, { timeout: downloadTimeout })
    .should('contain', '"Joe","Smith"')
  })

  it('handles zip file download', () => {
    cy.get('[data-cy=download-zip]').click()
    // not worth adding a dependency to read contents, just ensure it's there
    cy.readFile(`${Cypress.config('downloadsFolder')}/files.zip`, { timeout: downloadTimeout })
  })

  it('handles xlsx file download', () => {
    cy.get('[data-cy=download-xlsx]').click()
    // not worth adding a dependency to read contents, just ensure it's there
    cy.readFile(`${Cypress.config('downloadsFolder')}/people.xlsx`, { timeout: downloadTimeout })
  })
})
