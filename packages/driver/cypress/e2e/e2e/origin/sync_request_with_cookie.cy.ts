// https://github.com/cypress-io/cypress/pull/32925
describe('Sync Request in cy.origin that sets cookie', () => {
  it('passes', () => {
    cy.intercept('https://foo.site.com', {
      body: `
        <!DOCTYPE html>
        <html>
        <body>
          Page 1 / 2
        </body>
        </html>
      `
    })
    cy.visit('https://foo.site.com')

    cy.intercept('https://test.site.com/sync', {
      headers: {
        'set-cookie': 'TEST=foo',
      },
      body: ''
    })
    cy.intercept('https://test.site.com/bar', {
      body: `
        <!DOCTYPE html>
        <html>
        <body>
          Page 2 / 2
          <script>
            let xhr = new window.XMLHttpRequest()
            xhr.open('GET', '/sync', false)
            xhr.send()
          </script>
        </body>
        </html>
      `
    })
    cy.origin('https://test.site.com', () => {
      cy.visit('https://test.site.com/bar')
      cy.wrap(0).should('eq', 0)
    })
  })
})
