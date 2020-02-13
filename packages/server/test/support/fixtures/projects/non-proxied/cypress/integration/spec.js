const serverUrl = `http://localhost:${Cypress.config('port')}`

context('non proxied e2e', () => {
  it('has the expected look', () => {
    cy.task('get:tmp:path')
    .then((path) => {
      const pngPath = `${path}/cy-non-proxied.png`

      // use google chrome to screenshot what the server shows
      cy.exec(`"${Cypress.browser.path}" --headless --disable-gpu --no-sandbox --user-data-dir=${path}/nonproxiedprofile --screenshot=${pngPath} ${serverUrl}`)

      cy.readFile(pngPath, 'base64')
      .then((actual) => {
        cy.fixture('cy-non-proxied.png')
        .then((expected) => {
          expect(actual).to.eq(expected)
        })
      })
    })
  })
})
