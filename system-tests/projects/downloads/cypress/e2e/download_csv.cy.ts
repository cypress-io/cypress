/// <reference types="cypress" />

describe('downloads', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/downloads.html')
  })

  it('downloads cvs file', () => {
    // Note that we don't wait for the download here. If we ever need to do a wait here to ensure that the download happens,
    // we need to make sure that wait is smaller than the proxy correlation timeout. Otherwise, we may be papering over a bug
    // in the proxy correlation logic.
    cy.get('[data-cy=download-csv]').click()
  })
})
