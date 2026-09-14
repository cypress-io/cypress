context('non proxied e2e', () => {
  it('has the expected look', () => {
    cy.task('get:tmp:path')
    .then((path) => {
      const pngPath = `${path}/cy-non-proxied.png`

      // use google chrome to screenshot what the server shows
      cy.task('screenshot:with:browser', {
        browserPath: Cypress.browser.path,
        userDataDir: `${path}/nonproxiedprofile`,
        screenshotPath: pngPath,
        url: Cypress.config('proxyUrl'),
      })

      cy.readFile(pngPath, 'base64')
      .then((actual) => {
        cy.fixture('cy-non-proxied.png')
        .then((expected) => {
          expect(actual, 'screenshots did not match byte-for-byte').to.eq(expected)
        })
      })
    })
  })

  it('cannot connect to ws', () => {
    cy.task('assert:ws:fails', Cypress.config())
  })

  it('can connect to proxied ws', () => {
    cy.task('assert:proxied:ws:works', Cypress.config())
  })
})
