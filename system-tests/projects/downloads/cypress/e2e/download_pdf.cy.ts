/// <reference types="cypress" />

describe('pdf downloads', () => {
  // Opening a PDF via window.open should download it to the downloadsFolder
  // rather than rendering it inline in Chrome's PDF viewer. Chrome's "new"
  // headless mode (default since Cypress 12.15.0) ships the PDF viewer, which
  // previously caused the PDF to open in a new tab and stall the run.
  // https://github.com/cypress-io/cypress/issues/27342
  it('downloads a pdf opened via window.open', () => {
    cy.visit('/cypress/fixtures/downloads.html')
    cy.get('[data-cy=open-pdf]').click()
    cy.readFile(`${Cypress.config('downloadsFolder')}/sample.pdf`, { timeout: 10000 })
    .should('contain', '%PDF')
  })
})
