describe('Cypress cookies on the application\'s origin', { browser: '!webkit' }, () => {
  const originUrl = 'https://www.foobar.com:3502'

  const fetchWithCookies = (cookies: string[]) => {
    cy.intercept(`${originUrl}/dump-headers`).as('req')

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cookie-https"]').click()

    return cy.origin(originUrl, { args: { cookies } }, ({ cookies }) => {
      // a cookie set by a response stays in the server's cookie jar, which a document.cookie write of a Cypress cookie does not
      cy.window().then((win) => {
        return cy.wrap(Promise.all(cookies.map((cookie) => win.fetch(`/set-cookie?cookie=${cookie}; Path=/`))))
      })

      cy.reload()
      cy.document().its('cookie').should('include', '__cypress.unload=true')

      cy.window().then((win) => {
        return cy.wrap(win.fetch('/dump-headers').then((res) => res.text()))
      })
    })
  }

  it('sends only the application\'s cookies with its requests', () => {
    fetchWithCookies(['__cypress.unload=true', 'session_id=8f2c1e9a40b7']).then((headersReceived) => {
      expect(headersReceived).to.include('"cookie":"session_id=8f2c1e9a40b7"')
    })

    cy.wait('@req').its('request.headers.cookie').should('eq', 'session_id=8f2c1e9a40b7')
  })

  it('sends no cookies when the application has none', () => {
    fetchWithCookies(['__cypress.unload=true']).then((headersReceived) => {
      expect(headersReceived).not.to.include('"cookie"')
    })

    cy.wait('@req').its('request.headers.cookie').should('be.undefined')
  })
})
