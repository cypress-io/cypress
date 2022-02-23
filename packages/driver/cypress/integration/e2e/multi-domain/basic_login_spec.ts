// @ts-ignore / session support is needed for visiting about:blank between tests
describe('basic login', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  // Custom login command that establishes a session
  const login = (name) => {
    cy.session(name, () => {
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/auth/idp.html'
      })

      cy.switchToDomain('foobar.com', [name], ([name]) => {
        cy.get('[data-cy="username"]').type(name)
        cy.get('[data-cy="login"]').click()
      })
    })
  }

  // Scenario, Token based auth. Visit site, redirect to IDP hosted on secondary domain, login and redirect back to site.
  describe('visit primary first', () => {
    // TODO: these were being flaky on firefox, disable until we have a trailing wait
    it.skip('logs in with idp redirect', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.get('[data-cy="login"]').click() // Takes you to identityProvider.com
      cy.switchToDomain('foobar.com', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      }) // Trailing edge wait, waiting to return to the primary domain

      // Verify that the user has logged in on /siteA
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    // Scenario, Token based auth. Visit site, manually redirect to IDP hosted on secondary domain, login and redirect back to site.
    // TODO: these were being flaky on firefox, disable until we have a trailing wait
    it.skip('does not redirect', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      // Missing the call to go to idp.com
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/auth/idp.html'
      })

      cy.switchToDomain('foobar.com', () => {
        cy.get('[data-cy="username"]').type('FJohnson')
        cy.get('[data-cy="login"]').click()
      })

      // Verify that the user has logged in on /siteA
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome FJohnson')
    })
  })

  // Scenario, Token based auth. Visit IDP hosted on secondary domain, login and redirect back to site.
  describe('visit secondary first', () => {
    // Problem: where does the primary domain get established
    // TODO: these were being flaky on firefox, disable until we have a trailing wait
    it.skip('logs in with idp redirect', () => {
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/auth/idp.html'
      })

      cy.switchToDomain('foobar.com', () => {
        cy.get('[data-cy="username"]').type('FJohnson')
        cy.get('[data-cy="login"]').click()
      })

      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome FJohnson')
    })

    // Scenario, Token based auth. Establish session using custom login command (login through IDP hosted on secondary domain), and verify to site.
    // TODO: These tests aren't working in CI, need to investigate
    it.skip('establishes a session', () => {
      login('BJohnson')
      cy.visit('/fixtures/auth/index.html')
      // Verify that the user has logged in on /siteA
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    // Scenario, Token based auth. use previously established session, and verify to site.
    // TODO: These tests aren't working in CI, need to investigate
    it.skip('uses established session', () => {
      login('BJohnson')
      cy.visit('/fixtures/auth/index.html')
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    //     // Can we accomplish this with switchToDomain?
    //     it('logs in with idp redirect', () => {
    //       cy.window().then((win) => {
    //         win.location.href = 'http://www.admin.com'
    //       })

    //       cy.switchToDomain('identityProvider.com', () => {
    //         cy.visit('identityProvider.com') // Visit identityProvider.com
    //         cy
    //         .get('login stuff').click() // Magic button that logs you in. Redirects back to /siteA
    //       })

    //       cy.get('logged in user name') //Some how we know you're back at /siteA/ and continue to run. We need some options
    //     })

    //     // Option A
    //     it('logs in with idp redirect - baseURL', { baseUrl: '/siteA' }, () => { // Setting the base url
    //       cy.createDomain('identityProvider.com', () => {
    //         cy.visit('identityProvider.com') // Visit identityProvider.com
    //         cy
    //         .get('login stuff').click() // Magic button that logs you in. Redirects back to /siteA
    //       })

    //       cy.get('logged in user name') // We wait till we're back at site A before running.
    //     })

    //     // Option B
    //     it('logs in with idp redirect - createDomain Option', () => { // Setting the base url
    //       cy.createDomain('identityProvider.com', { primaryDomain: 'localhost' }, () => {
    //         cy.visit('identityProvider.com') // Visit identityProvider.com
    //         cy
    //         .get('login stuff').click() // Magic button that logs you in. Redirects back to /siteA
    //       })

    //       cy.get('logged in user name') // We wait till we're back on the primary domain before running.
    //     })

    //     // Option C
    //     it('logs in with idp redirect - require a visit', () => { // Setting the base url
    //       cy.createDomain('identityProvider.com', () => {
    //         cy.visit('identityProvider.com') // Visit identityProvider.com
    //         cy
    //         .get('login stuff').click() // Magic button that logs you in. Redirects back to /siteA
    //       })

    //       cy.visit('/siteA') // The user must explicitly visit to establish the primary domain for the test.
    //       cy.get('logged in user name') // We wait till we're back on the primary domain before running.
    //     })

    //     // Without Redirect
    //     it('logs in without idp redirect', () => {
    //       cy.createDomain('identityProvider.com', () => {
    //         cy.visit('identityProvider.com') // Visit identityProvider.com
    //         cy
    //         .get('login stuff').click() // Magic button that logs you in. Does not redirect, you're stuck.
    //       })

    //       cy.visit('/siteA') // The user must explicitly visit to establish the primary domain for the test.
    //       cy.get('logged in user name') // We wait till we're back on the primary domain before running.
    //     })

    //     // Above options apply here too.
    //     it('logs in without idp redirect', () => {
    //       cy.createDomain('identityProvider.com', () => {
    //         cy.visit('identityProvider.com') // Visit identityProvider.com
    //         cy
    //         .get('login stuff').click() // Magic button that logs you in. Does not redirect, you're stuck.

    //         cy.visit('localhost/siteA') // The user must explicitly visit, This should not establish primary domain.
    //       })

    //       cy.get('logged in user name') // We wait till we're back on the primary domain before running.
    //     })

    //     // What we don't want them to do, but should still work
    //     // Visit IDP first
    //     it('logs in with idp redirect - require a visit', () => { // Setting the base url
    //       cy.visit('identityProvider.com') // Visit identityProvider.com
    //       cy
    //       .get('login stuff').click() // Magic button that logs you in. Redirects back to /siteA

    //       cy.createDomain('localhost/siteA', () => {
    //         cy.visit('/siteA') // The user must explicitly visit to establish the primary domain for the test.
    //         cy.get('logged in user name') // We wait till we're back on the primary domain before running.
    //       })
    //     })
  })
})
