// @ts-nocheck / session support is needed for visiting about:blank between tests
describe('basic login', { experimentalSessionSupport: true }, () => {
  // Scenario, Token based auth. Visit site, redirect to IDP hosted on secondary domain, login and redirect back to site.
  describe('visit primary first', () => {
    it('logs in with idp redirect', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.switchToDomain('idp.com', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      }) // Trailing edge wait, waiting to return to the primary domain

      // Verify that the user has logged in on /siteA
      cy.get('[data-cy="welcome"]')
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

      // Verify that the user has logged in on /siteA
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome FJohnson')
    })

    // TODO: this test 'passes' but acts strangely by showing no log and fails the subsequent test
    it.skip('visits foobar first', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/auth/index.html') // Establishes Primary Domain
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.switchToDomain('idp.com', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      }) // Trailing edge wait, waiting to return to the primary domain

      // Verify that the user has logged in on /siteA
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })
  })

  // Scenario, Token based auth. Visit IDP hosted on secondary domain, login and redirect back to site.
  describe('visit secondary first', () => {
    describe('How to determine primary domain', () => {
      // NOTE: Enable to set the top domain to example.com before running the next test.
      it.skip('example.com', () => {
        cy.visit('http://www.example.com')
      })

      // TODO: This test will fail primary domain not established
      it.skip('A logs in with no primary - fail', { baseUrl: undefined }, () => {
        cy.createDomain('idp.com', () => { // PrimaryDomain is undefined: FAIL
          cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
          cy.get('[data-cy="username"]').type('FJohnson')
          cy.get('[data-cy="login"]').click()
        }) // auto wait on trailing edge for primary domain.

        cy.visit()

        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome FJohnson')
      })

      // Primary established via base url
      // TODO: Add createDomain
      it.skip('B logs in with primary set via baseurl', { baseUrl: 'http://localhost:3500' }, () => {
        cy.createDomain('idp.com', () => { // PrimaryDomain is localhost
          cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
          cy.get('[data-cy="username"]').type('FJohnson')
          cy.get('[data-cy="login"]').click()
        })

        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome FJohnson')
      })

      // TODO: Add createDomain
      it.skip('C logs in with primary set via visit', () => {
        cy.visit('/fixtures/auth/index.html')
        cy.createDomain('idp.com', () => { // PrimaryDomain is localhost
          cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
          cy.get('[data-cy="username"]').type('FJohnson')
          cy.get('[data-cy="login"]').click()
        })

        cy.visit('/fixtures/auth/index.html')

        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome FJohnson')
      })

      // TODO: Add createDomain primary domain config does not exist yet
      it.skip('D logs in with primary set via switch to domain config', { primaryDomain: 'localhost' }, () => {
        cy.createDomain('idp.com', () => { // PrimaryDomain set to localhost
          cy.visit('http://www.idp.com/fixtures/auth/idp.html')
          cy.get('[data-cy="username"]').type('FJohnson')
          cy.get('[data-cy="login"]').click()
        })

        cy.visit('/fixtures/auth/index.html')

        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome FJohnson')
      })
    })

    describe('session', () => {
    // Custom login command that establishes a session
      const login = (name) => {
        cy.session(name, () => {
          cy.createDomain('idp.com', [name], ([name]) => {
            cy.visit('http://www.idp.com/fixtures/auth/idp.html')
            cy.get('[data-cy="username"]').type(name)
            cy.get('[data-cy="login"]').click()
          })
        }, {
          validate: () => {
            // check the session is correct
          },
        })
      }

      // Scenario, Token based auth. Establish session using custom login command (login through IDP hosted on secondary domain), and verify to site.
      // TODO: Create domain is not yet implemented
      it.skip('establishes a session', { primaryDomain: 'localhost' }, () => {
        login('BJohnson')
        cy.visit('/fixtures/auth/index.html')
        // Verify that the user has logged in on /siteA
        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome BJohnson')
      })

      // Scenario, Token based auth. use previously established session, and verify to site.
      // TODO: Create domain is not yet implemented
      it.skip('uses established session', () => {
        login('BJohnson')
        cy.visit('/fixtures/auth/index.html')
        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome BJohnson')
      })
    })

    // What we don't want them to do, but should still work
    // Visit IDP first
    // TODO: this breaks tests after it and looks wonky
    it.skip('logs in and runs the test in switchToDomain', () => { // Setting the base url
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
describe('Multi-step Auth', { experimentalSessionSupport: true }, () => {
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

  // TODO: Switch to domain does not work multiple times in a test
  it.skip('final-auth redirects back to localhost - flat', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
    cy.domain('foobar.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
    }) // waits on localhost forever, this breaks

    cy.domain('idp.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="username"]').type('MarkyMark')
      cy.get('[data-cy="login"]').click() // Takes you back to localhost
    }) // waits on localhost

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
    }) // Waits on localhost because there are subsequent commands

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
      }) // Waits on foobar because there are subsequent commands

      cy.get('[data-cy="login-success"]').click() // Takes you back to localhost
    }) // Waits on localhost because there are subsequent commands

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })

  // TODO: Switch to domain does not work multiple times in a test
  it.skip('final auth redirects back to approval page - flat', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
    cy.switchToDomain('foobar.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
    }) // waits on localhost forever, this breaks

    cy.switchToDomain('idp.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="username"]').type('MarkyMark')
      cy.get('[data-cy="login"]').click() // Takes you back to foobar.com.../approval
    }) // waits on foobar forever, this breaks

    cy.switchToDomain('foobar.com', () => { // Parent Domain is localhost
      cy.get('[data-cy="login-success"]').click() // Takes you back to localhost
    }) // Waits on localhost because there are subsequent commands

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })
})
