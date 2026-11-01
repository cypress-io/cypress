describe('remote driver: basic login in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  // Scenario, Token based auth. Visit site, redirect to IDP hosted on secondary origin, login and redirect back to site.
  describe('visit primary first', () => {
    it('logs in with idp redirect', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.get('[data-cy="login"]').click()

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    // Scenario, Token based auth. Visit site, manually redirect to IDP hosted on secondary origin, login and redirect back to site.
    it('does not redirect', () => {
      cy.visit('/fixtures/auth/index.html')

      // the app has no built-in redirect here, so a click on the page starts it
      cy.get('body').invoke('attr', 'onclick', `location.href = 'http://www.idp.com:3500/fixtures/auth/idp.html?redirect=' + encodeURIComponent(location.href)`)
      cy.get('body').trigger('click', { force: true })

      cy.get('[data-cy="username"]').type('FJohnson')
      cy.get('[data-cy="login"]').click()

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome FJohnson')
    })

    it('visits foobar first', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/auth/index.html')
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.get('[data-cy="login"]').click()

      // Verify that the user has logged in on foobar.com
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })
  })

  // Scenario, Token based auth. Visit IDP hosted on secondary origin, login and redirect back to site.
  describe('visit secondary first', () => {
    it('logs in by visiting the IdP after the site', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
      cy.get('[data-cy="username"]').type('FJohnson')
      cy.get('[data-cy="login"]').click()

      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome FJohnson')
    })

    describe('session', () => {
      // Custom login command that establishes a session
      const login = (name: string) => {
        cy.session(name, () => {
          cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
          cy.get('[data-cy="username"]').type(name)
          cy.get('[data-cy="login"]').click()

          cy.url().should('contain', '/index.html')
        }, {
          validate: () => {
            cy.visit('/fixtures/auth/index.html')
            cy.get('[data-cy="welcome"]').should('exist')
          },
        })
      }

      // Scenario, Token based auth. Establish session using custom login command (login through IDP hosted on secondary origin), and verify to site.
      it('establishes a session', () => {
        login('BJohnson')
        cy.visit('/fixtures/auth/index.html')
        // Verify that the user has logged in on localhost
        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome BJohnson')
      })

      // Scenario, Token based auth. use previously established session, and verify to site.
      it('uses established session', () => {
        login('BJohnson')
        cy.visit('/fixtures/auth/index.html')
        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome BJohnson')
      })
    })

    it('logs in after visiting the IdP first', () => {
      cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
      cy.get('[data-cy="username"]').type('FJohnson')
      cy.get('[data-cy="login"]').click()

      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome FJohnson')
    })
  })

  describe('Multi-step Auth', () => {
    it('final auth redirects back to localhost', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
      cy.get('[data-cy="username"]').type('MarkyMark')
      cy.get('[data-cy="login"]').click() // Takes you back to localhost

      // Verify that the user has logged in
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome MarkyMark')
    })

    it('final auth redirects back to localhost - approval first', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/auth/approval.html')
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
      cy.get('[data-cy="username"]').type('MarkyMark')
      cy.get('[data-cy="login"]').click() // Takes you back to localhost

      // Verify that the user has logged in
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome MarkyMark')
    })

    it('final auth redirects back to approval page', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
      cy.get('[data-cy="approve-me"]').click() // takes you to idp.com
      cy.get('[data-cy="username"]').type('MarkyMark')
      cy.get('[data-cy="login"]').click() // Takes you back to foobar.com.../approval
      cy.get('[data-cy="login-success"]').click() // Takes you back to localhost

      // Verify that the user has logged in
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome MarkyMark')
    })
  })
})
