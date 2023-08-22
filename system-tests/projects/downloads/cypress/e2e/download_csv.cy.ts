/// <reference types="cypress" />

describe('downloads', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/downloads.html')
  })

  it('downloads cvs file', () => {
    // wait 600ms after the click to wait/finish the download of the file
    cy.get('[data-cy=download-csv]').click().wait(600)
  })
})
