describe('Cypress cookies on the application\'s origin', { browser: '!webkit' }, () => {
  const originUrl = 'https://www.foobar.com:3502'

  const fetchWithCookies = (cookies: string[]) => {
    cy.intercept(`${originUrl}/dump-headers`).as('req')

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cookie-https"]').click()

    return cy.origin(originUrl, { args: { originUrl, cookies } }, ({ originUrl, cookies }) => {
      cy.window().then((win) => {
        cookies.forEach((cookie) => win.document.cookie = cookie)

        expect(win.document.cookie).to.include('__cypress.unload=true')

        return cy.wrap(win.fetch(`${originUrl}/dump-headers`).then((res) => res.text()))
      })
    })
  }

  it('sends only the application\'s cookies with its requests', () => {
    fetchWithCookies(['__cypress.unload=true; Path=/', 'session_id=8f2c1e9a40b7; Path=/']).then((headersReceived) => {
      expect(headersReceived).to.include('"cookie":"session_id=8f2c1e9a40b7"')
    })

    cy.wait('@req').its('request.headers.cookie').should('eq', 'session_id=8f2c1e9a40b7')
  })

  it('sends no cookies when the application has none', () => {
    fetchWithCookies(['__cypress.unload=true; Path=/']).then((headersReceived) => {
      expect(headersReceived).not.to.include('"cookie"')
    })

    cy.wait('@req').its('request.headers.cookie').should('be.undefined')
  })
})
