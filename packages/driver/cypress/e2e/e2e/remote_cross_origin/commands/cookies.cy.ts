describe('remote driver: cookies in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  context('client side', () => {
    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    it('.getCookie(), .getCookies(), and .setCookie()', () => {
      cy.getCookies().should('be.empty')

      cy.setCookie('foo', 'bar')

      cy.getCookie('foo').should('have.property', 'value', 'bar')
      cy.getCookie('foo').should('have.property', 'domain').and('include', 'foobar.com')
      cy.getCookies().should('have.length', 1)
    })

    it('.clearCookie()', () => {
      cy.setCookie('foo', 'bar')
      cy.getCookie('foo').should('not.be.null')
      cy.clearCookie('foo')
      cy.getCookie('foo').should('be.null')
    })

    it('.clearCookies()', () => {
      cy.setCookie('foo', 'bar')
      cy.setCookie('faz', 'baz')

      cy.getCookies().should('have.length', 2)
      cy.clearCookies()
      cy.getCookies().should('be.empty')
    })
  })

  context('server side', () => {
    it('supports Set-Cookie response header through fetch request', () => {
      cy.intercept('/set-cookie*').as('setCookie')
      cy.intercept('/dump-headers').as('headers')

      cy.visit('http://www.foobar.com:3500/')
      cy.document().invoke('defaultView.fetch', '/set-cookie?cookie=foo=bar;')
      cy.wait('@setCookie')

      cy.document().invoke('location.assign', 'http://www.foobar.com:3500/dump-headers')

      cy.wait('@headers')

      cy.contains('"cookie":"foo=bar"')
      cy.wait(0) // Give the server a chance to catch up
      cy.getCookie('foo').its('value').should('equal', 'bar')
    })
  })
})
