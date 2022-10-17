describe('basic login', { browser: '!webkit' }, () => {
  // Scenario, Token based auth. Visit site, redirect to IDP hosted on secondary origin, login and redirect back to site.
  describe('visit primary first', () => {
    it('logs in with idp redirect', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes primary origin
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.origin('http://www.idp.com:3500', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]') // Stability is false, this command is prevented from running until stability is achieved.
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })

    // Scenario, Token based auth. Visit site, manually redirect to IDP hosted on secondary origin, login and redirect back to site.
    it('does not redirect', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes primary origin
      // Missing the call to go to idp.com
      cy.window().then((win) => {
        win.location.href = 'http://www.idp.com:3500/fixtures/auth/idp.html'
      })

      cy.origin('http://www.idp.com:3500', () => {
        cy.get('[data-cy="username"]').type('FJohnson')
        cy.get('[data-cy="login"]').click()
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome FJohnson')
    })

    it('visits foobar first', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/auth/index.html') // Establishes primary origin
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.origin('http://www.idp.com:3500', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      })

      // Verify that the user has logged in on localhost
      cy.get('[data-cy="welcome"]') // Stability is false, this command is prevented from running until stability is achieved.
      .invoke('text')
      .should('equal', 'Welcome BJohnson')
    })
  })

  // Scenario, Token based auth. Visit IDP hosted on secondary origin, login and redirect back to site.
  describe('visit secondary first', () => {
    describe('How to determine primary origin', () => {
      // NOTE: Enable to set the top origin to foobar before running the next test.
      it.skip('reset top', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/auth/index.html')
      })

      // Primary established via base url
      // TODO: baseUrl does not establish primary without a visit
      it.skip('logs in with primary set via baseurl', { baseUrl: 'http://localhost:3500' }, () => {
        cy.origin('http://www.idp.com:3500', () => { // primary origin is localhost
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
        cy.origin('http://www.idp.com:3500', () => { // primary origin is localhost
          cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
          cy.get('[data-cy="username"]').type('FJohnson')
          cy.get('[data-cy="login"]').click()
        })

        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome FJohnson')
      })
    })

    describe('session', () => {
    // Custom login command that establishes a session
      const login = (name) => {
        cy.session(name, () => {
          // Note, this assumes localhost is the primary origin, ideally we'd be able to specify this directly.
          cy.origin('http://www.idp.com:3500', { args: name }, (name) => {
            cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
            cy.get('[data-cy="username"]').type(name)
            cy.get('[data-cy="login"]').click()
          })

          cy.url().should('contain', '/index.html')
        }, {
          validate: () => {
            cy.window().then((win) => {
              const cypressAuthToken = win.sessionStorage.getItem('cypressAuthToken')

              return !!cypressAuthToken
            })
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

    // What we don't want them to do, but should still work
    // Visit IDP first
    it('logs in and runs the test in cy.origin', () => { // Setting the base url
      cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html') // Visit idp.com
      cy.get('[data-cy="username"]').type('FJohnson')
      cy.get('[data-cy="login"]').click()

      cy.origin('http://localhost:3500', () => {
        cy.get('[data-cy="welcome"]')
        .invoke('text')
        .should('equal', 'Welcome FJohnson')
      })
    })
  })
})

describe('Multi-step Auth', { browser: '!webkit' }, () => {
  // TODO: cy.origin does not work in cy.origin yet.
  it.skip('final auth redirects back to localhost - nested', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
    cy.url() //fail
    cy.origin('http://www.foobar.com:3500', () => { // Parent origin is localhost
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
      cy.origin('http://www.idp.com:3500', () => { // Parent origin is foobar.com
        cy.get('[data-cy="username"]').type('MarkyMark')
        cy.get('[data-cy="login"]').click() // Takes you back to localhost
      }) // Does not wait on foobar.com because there are no subsequent commands (would wait forever)
    }) // Waits on localhost because there are subsequent commands

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })

  // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23481
  it.skip('final-auth redirects back to localhost - flat', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
    cy.origin('http://www.foobar.com:3500', () => { // Parent origin is localhost
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
    }) // Exits and moves on to the next command

    cy.origin('http://www.idp.com:3500', () => { // Parent origin is localhost
      cy.get('[data-cy="username"]').type('MarkyMark')
      cy.get('[data-cy="login"]').click() // Takes you back to localhost
    }) // Exits and moves on to the next command

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })

  // TODO: cy.origin does not work in cy.origin yet.
  it.skip('final auth redirects back to localhost - nested - approval first', () => {
    cy.origin('http://www.foobar.com:3500', () => { // parent origin is localhost
      cy.visit('http://www.foobar.com:3500/fixtures/auth/approval.html')
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
      cy.origin('http://www.idp.com:3500', () => { // parent origin is foobar.com
        cy.get('[data-cy="username"]').type('MarkyMark')
        cy.get('[data-cy="login"]').click() // Takes you back to localhost
      }) // Does not wait on foobar.com because there are no subsequent commands (would wait forever)
    }) // Exits and moves on to the next command

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })

  // TODO: Switch to origin does not work in switch to origin yet.
  it.skip('final auth redirects back to approval page - nested', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
    cy.origin('http://www.foobar.com:3500', () => { // parent origin is localhost
      cy.get('[data-cy="approve-me"]').click() // takes you to idp.com
      cy.origin('http://www.idp.com:3500', () => { // parent origin is foobar.com
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
    cy.origin('http://www.foobar.com:3500', () => { // parent origin is localhost
      cy.get('[data-cy="approve-me"]').click() // takes you to idp.com
    }) // waits on localhost forever, this breaks

    cy.origin('http://www.idp.com:3500', () => { // parent origin is localhost
      cy.get('[data-cy="username"]').type('MarkyMark')
      cy.get('[data-cy="login"]').click() // Takes you back to foobar.com.../approval
    }) // Exits and moves on to the next command

    cy.origin('http://www.foobar.com:3500', () => { // parent origin is localhost
      cy.get('[data-cy="login-success"]').click() // Takes you back to localhost
    }) // Exits and moves on to the next command

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })
})
