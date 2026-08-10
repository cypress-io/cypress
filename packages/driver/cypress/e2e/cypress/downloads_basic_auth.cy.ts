import { authCreds } from '../../fixtures/auth_creds'

// Kept out of downloads.cy.ts so the always-on
// driver-integration-tests-*-cdp-remediated jobs (which pin
// `spec: cypress/e2e/cypress/downloads.cy.ts`) stay green. Under
// CYPRESS_INTERNAL_DISABLE_PROXY=1 this hangs: Network.enable never settles on
// the extra target's CDP session, so MaybeSetBasicAuthHeaders never runs and the
// origin answers 401. @see https://github.com/cypress-io/cypress/issues/34512
// Fold this back into downloads.cy.ts once that is fixed.
describe('basic auth download behavior', () => {
  beforeEach(() => {
    cy.visit('/fixtures/downloads.html', {
      auth: authCreds,
    })
  })

  // NOTE: webkit opens a new window and doesn't download the file
  it('downloads basic auth protected file that opens in a new tab', { browser: '!webkit' }, () => {
    cy.exec(`rm -f ${Cypress.config('downloadsFolder')}/download-basic-auth.csv`)
    cy.readFile(`${Cypress.config('downloadsFolder')}/download-basic-auth.csv`).should('not.exist')

    cy.get('[data-cy=download-basic-auth]').click()
    cy.readFile(`${Cypress.config('downloadsFolder')}/download-basic-auth.csv`)
    .should('contain', '"Joe","Smith"')
  })
})
