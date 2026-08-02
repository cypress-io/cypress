/// <reference types="cypress" />

describe('downloads', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/downloads.html')
  })

  it('handles csv file download', () => {
    cy.get('[data-cy=download-csv]').click()
    cy
    // This timeout must stay below the proxy correlation timeout (2000ms, see
    // packages/proxy/lib/http/util/prerequests.ts) so that a correlation regression, which
    // would stall the download for the full 2000ms, still fails here instead of being papered
    // over. 1500ms keeps that guarantee while giving healthy downloads slack against CI load.
    .readFile(`${Cypress.config('downloadsFolder')}/records.csv`, { timeout: 1500 })
    .should('contain', '"Joe","Smith"')
  })

  it('handles zip file download', () => {
    cy.get('[data-cy=download-zip]').click()
    // not worth adding a dependency to read contents, just ensure it's there
    // This timeout must stay below the proxy correlation timeout (2000ms, see
    // packages/proxy/lib/http/util/prerequests.ts) so that a correlation regression, which
    // would stall the download for the full 2000ms, still fails here instead of being papered
    // over. 1500ms keeps that guarantee while giving healthy downloads slack against CI load.
    cy.readFile(`${Cypress.config('downloadsFolder')}/files.zip`, { timeout: 1500 })
  })

  it('handles xlsx file download', () => {
    cy.get('[data-cy=download-xlsx]').click()
    // not worth adding a dependency to read contents, just ensure it's there
    // This timeout must stay below the proxy correlation timeout (2000ms, see
    // packages/proxy/lib/http/util/prerequests.ts) so that a correlation regression, which
    // would stall the download for the full 2000ms, still fails here instead of being papered
    // over. 1500ms keeps that guarantee while giving healthy downloads slack against CI load.
    cy.readFile(`${Cypress.config('downloadsFolder')}/people.xlsx`, { timeout: 1500 })
  })
})
