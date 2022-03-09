/// <reference types="cypress" />

describe('downloads', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/downloads.html')
  })

  it('handles csv file download', () => {
    // HACK: monkey-patching Cypress.downloads.end to ensure the download has
    // finished before asserting on its contents. this test was flakey b/c
    // sometimes file was read before the browser had written its contents.
    // consider creating events for downloads or some API, so that this can
    // be done without hacks
    const awaitDownload = new Promise<void>((resolve) => {
      // @ts-ignore
      const end = Cypress.downloads.end

      // @ts-ignore
      Cypress.downloads.end = (arg) => {
        resolve()

        return end(arg)
      }
    })

    cy.get('[data-cy=download-csv]').click().then(() => {
      return awaitDownload
    })

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
