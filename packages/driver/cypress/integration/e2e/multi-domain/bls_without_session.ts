// @ts-nocheck / session support is needed for visiting about:blank between tests
describe('basic login without session', { experimentalSessionSupport: true }, () => {
  // Scenario, Token based auth. Visit site, redirect to IDP hosted on secondary domain, login and redirect back to site.
  describe('visit primary first', () => {
    it('logs in with idp redirect', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.switchToDomain('idp.com', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]') // Stability is false, this command is prevented from running until stability is achieved.
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    // Scenario, Token based auth. Visit site, manually redirect to IDP hosted on secondary domain, login and redirect back to site.
    it('does not redirect', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      // Missing the call to go to idp.com
      cy.window().then((win) => {
        win.location.href = 'http://www.idp.com:3500/fixtures/auth/idp.html'
      })

      cy.switchToDomain('idp.com', () => {
        cy.get('[data-cy="username"]').type('FJohnson')
        cy.get('[data-cy="login"]').click()
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome FJohnson')
    })

    it('visits foobar first', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/auth/index.html') // Establishes Primary Domain
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.switchToDomain('idp.com', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]') // Stability is false, this command is prevented from running until stability is achieved.
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })
  })

  // Scenario, Token based auth. Visit IDP hosted on secondary domain, login and redirect back to site.
  describe('visit secondary first', () => {
    describe('How to determine primary domain', () => {
      // NOTE: Enable to set the top domain to foobar before running the next test.
      it.skip('reset top', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/auth/index.html')
      })

      // Primary established via base url
      // TODO: baseUrl does not establish primary without a visit
      it.skip('logs in with primary set via baseurl', { baseUrl: 'http://localhost:3500' }, () => {
        cy.switchToDomain('idp.com', () => { // PrimaryDomain is localhost
          cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
          cy.get('[data-cy="username"]').type('FJohnson')
          cy.get('[data-cy="login"]').click()
        })

        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome FJohnson')
      })

      it('reset top', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/auth/index.html')
      })

      it('logs in with primary set via visit', () => {
        cy.visit('/fixtures/auth/index.html')
        cy.switchToDomain('idp.com', () => { // PrimaryDomain is localhost
          cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
          cy.get('[data-cy="username"]').type('FJohnson')
          cy.get('[data-cy="login"]').click()
        })

        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome FJohnson')
      })

      // NOTE: Enable to set the top domain to foobar before running the next test.
      it.skip('reset top', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/auth/index.html')
      })

      // TODO: Add createDomain primary domain config does not exist yet
      it.skip('D logs in with primary set via switch to domain config', { baseUrl: undefined, primaryDomain: 'localhost' }, () => {
        cy.createDomain('idp.com', () => { // PrimaryDomain set to localhost
          cy.visit('http://www.idp.com/fixtures/auth/idp.html')
          cy.get('[data-cy="username"]').type('FJohnson')
          cy.get('[data-cy="login"]').click()
        })

        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome FJohnson')
      })
    })

    // What we don't want them to do, but should still work
    // Visit IDP first
    it('logs in and runs the test in switchToDomain', () => { // Setting the base url
      cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html') // Visit idp.com
      cy.get('[data-cy="username"]').type('FJohnson')
      cy.get('[data-cy="login"]').click()

      cy.switchToDomain('localhost', () => {
        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome FJohnson')
      })
    })
  })
})

// session support is needed for visiting about:blank between tests
describe('Multi-step Auth without session', { experimentalSessionSupport: true }, () => {
  // TODO: Switch to domain does not work in switch to domain yet.
  it.skip('final auth redirects back to localhost - nested', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
    cy.url() //fail
    cy.switchToDomain('foobar.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
      cy.switchToDomain('idp.com', () => { // Parent domain is foobar.com
        cy.get('[data-cy="username"]').type('MarkyMark')
        cy.get('[data-cy="login"]').click() // Takes you back to localhost
      }) // Does not wait on foobar.com because there are no subsequent commands (would wait forever)
    }) // Waits on localhost because there are subsequent commands

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })

  it('final-auth redirects back to localhost - flat', { pageLoadTimeout: 5000 }, () => {
    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
    cy.switchToDomain('foobar.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
    }) // Exits and moves on to the next command

    cy.switchToDomain('idp.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="username"]').type('MarkyMark')
      cy.get('[data-cy="login"]').click() // Takes you back to localhost
    }) // Exits and moves on to the next command

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })

  // TODO: Switch to domain does not work in switch to domain yet.
  it.skip('final auth redirects back to localhost - nested - approval first', () => {
    cy.createDomain('foobar.com', { primaryDomain: 'localhost' }, () => { // Parent Domain is localhost
      cy.visit('http://www.foobar.com:3500/fixtures/auth/approval.html')
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
      cy.switchToDomain('idp.com', () => { // Parent domain is foobar.com
        cy.get('[data-cy="username"]').type('MarkyMark')
        cy.get('[data-cy="login"]').click() // Takes you back to localhost
      }) // Does not wait on foobar.com because there are no subsequent commands (would wait forever)
    }) // Exits and moves on to the next command

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })

  // TODO: Switch to domain does not work in switch to domain yet.
  it.skip('final auth redirects back to approval page - nested', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
    cy.switchToDomain('foobar.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="approve-me"]').click() // takes you to idp.com
      cy.switchToDomain('idp.com', () => { // Parent domain is foobar.com
        cy.get('[data-cy="username"]').type('MarkyMark')
        cy.get('[data-cy="login"]').click() // Takes you back to foobar.com.../approval
      }) // Exits and moves on to the next command

      cy.get('[data-cy="login-success"]').click() // Takes you back to localhost
    }) // Exits and moves on to the next command

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })

  it('final auth redirects back to approval page - flat', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
    cy.switchToDomain('foobar.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="approve-me"]').click() // takes you to idp.com
    }) // Exits and moves on to the next command

    cy.switchToDomain('idp.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="username"]').type('MarkyMark')
      cy.get('[data-cy="login"]').click() // Takes you back to foobar.com.../approval
    }) // Exits and moves on to the next command

    cy.switchToDomain('foobar.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="login-success"]').click() // Takes you back to localhost
    }) // Exits and moves on to the next command

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })
})
