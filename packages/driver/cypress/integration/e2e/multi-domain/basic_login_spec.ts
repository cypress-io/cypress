// @ts-nocheck / session support is needed for visiting about:blank between tests
describe('basic login', { experimentalSessionSupport: true }, () => {
  // Scenario, Token based auth. Visit site, redirect to IDP hosted on secondary domain, login and redirect back to site.
  describe('visit primary first', () => {
    it('logs in with idp redirect', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.switchToDomain('http://idp.com:3500', () => {
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

      cy.switchToDomain('http://idp.com:3500', () => {
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
      cy.switchToDomain('http://idp.com:3500', () => {
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
        cy.switchToDomain('http://idp.com:3500', () => { // PrimaryDomain is localhost
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
        cy.switchToDomain('http://idp.com:3500', () => { // PrimaryDomain is localhost
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
        cy.createDomain('http://idp.com:3500', () => { // PrimaryDomain set to localhost
          cy.visit('http://www.idp.com/fixtures/auth/idp.html')
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
          // Note, this assumes localhost is the primary domain, ideally we'd be able to specify this directly.
          cy.switchToDomain('http://idp.com:3500', [name], ([name]) => {
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

      // Scenario, Token based auth. Establish session using custom login command (login through IDP hosted on secondary domain), and verify to site.
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
    it('logs in and runs the test in switchToDomain', () => { // Setting the base url
      cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html') // Visit idp.com
      cy.get('[data-cy="username"]').type('FJohnson')
      cy.get('[data-cy="login"]').click()

      cy.switchToDomain('http://localhost:3500', () => {
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
    cy.switchToDomain('http://foobar.com:3500', () => { // Parent Domain is localhost
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
      cy.switchToDomain('http://idp.com:3500', () => { // Parent domain is foobar.com
        cy.get('[data-cy="username"]').type('MarkyMark')
        cy.get('[data-cy="login"]').click() // Takes you back to localhost
      }) // Does not wait on foobar.com because there are no subsequent commands (would wait forever)
    }) // Waits on localhost because there are subsequent commands

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })

  it('final-auth redirects back to localhost - flat', () => {
    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-with-approval"]').click() // takes you to foobar.com.../approval
    cy.switchToDomain('http://foobar.com:3500', () => { // Parent Domain is localhost
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
    }) // Exits and moves on to the next command

    cy.switchToDomain('http://idp.com:3500', () => { // Parent Domain is localhost
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
    cy.createDomain('http://foobar.com:3500', { primaryDomain: 'localhost' }, () => { // Parent Domain is localhost
      cy.visit('http://www.foobar.com:3500/fixtures/auth/approval.html')
      cy.get('[data-cy="approve-orig"]').click() // takes you to idp.com
      cy.switchToDomain('http://idp.com:3500', () => { // Parent domain is foobar.com
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
    cy.switchToDomain('http://foobar.com:3500', () => { // Parent Domain is localhost
      cy.get('[data-cy="approve-me"]').click() // takes you to idp.com
      cy.switchToDomain('http://idp.com:3500', () => { // Parent domain is foobar.com
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
    cy.switchToDomain('http://foobar.com:3500', () => { // Parent Domain is localhost
      cy.get('[data-cy="approve-me"]').click() // takes you to idp.com
    }) // waits on localhost forever, this breaks

    cy.switchToDomain('http://idp.com:3500', () => { // Parent Domain is localhost
      cy.get('[data-cy="username"]').type('MarkyMark')
      cy.get('[data-cy="login"]').click() // Takes you back to foobar.com.../approval
    }) // Exits and moves on to the next command

    cy.switchToDomain('http://foobar.com:3500', () => { // Parent Domain is localhost
      cy.get('[data-cy="login-success"]').click() // Takes you back to localhost
    }) // Exits and moves on to the next command

    // Verify that the user has logged in
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome MarkyMark')
  })
})

describe('errors', { experimentalSessionSupport: true }, () => {
  it('reset top', () => {
    cy.visit('http://www.foobar.com:3500/fixtures/auth/index.html')
  })

  // This test will fail primary domain not established
  it('logs in with no primary - fail', { baseUrl: undefined, pageLoadTimeout: 5000 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out after waiting \`5000ms\` for your remote page to load.`)
      done()
    })

    cy.switchToDomain('http://idp.com:3500', () => { // Implicitly primary domain is foobar since the previous test set it to foobar. This command times out because we return to localhost, not foobar.
      cy.visit('http://www.idp.com:3500/fixtures/auth/idp.html')
      cy.get('[data-cy="username"]').type('FJohnson')
      cy.get('[data-cy="login"]').click() // Redirects to localhost
    })

    cy.get('[data-cy="welcome"]') // Timeout on command, cannot find element (sorry, your element is in another domain)
    .invoke('text')
    .should('equal', 'Welcome FJohnson')
  })

  it('never redirects to the subDomain', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms: Expected to find element: \`[data-cy="username"]\`, but never found it`)
      //  make sure that the secondary domain failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]')
    cy.switchToDomain('http://idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson') // Timeout here on command, cannot find element
      cy.get('[data-cy="login"]').click()
    })

    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('redirects to the wrong subDomain', { pageLoadTimeout: 5000 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out after waiting \`5000ms\` for your remote page to load.`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-foobar"]').click() // Timeout on page load here, we never reach the expected domain
    cy.switchToDomain('http://idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.get('[data-cy="login"]').click()
    })

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]')
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('never returns to the primary domain', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms: Expected to find element: \`[data-cy="welcome"]\`, but never found it`)
      //  make sure that the secondary domain failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]').click()
    cy.switchToDomain('http://idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
    }) // switchToDomain is stable so the command exits

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]') // Timeout here on command, cannot find element
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('redirects to an unexpected subdomain', { pageLoadTimeout: 5000 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out after waiting \`5000ms\` for your remote page to load.`)
      done()
    })

    cy.visit('/fixtures/auth/index.html')
    cy.get('[data-cy="login-idp"]').click()
    cy.switchToDomain('http://idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.window().then((win) => {
        win.location.href = 'http://www.foobar.com:3500/fixtures/auth/index.html'
      })
    })

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]') // Timeout here on command, cannot find element
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })

  it('fails in switchToDomain when a command is run after we return to localhost', { defaultCommandTimeout: 50 }, (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include(`Timed out retrying after 50ms: Expected to find element: \`[data-cy="cannot_find"]\`, but never found it`)
      //  make sure that the secondary domain failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
      done()
    })

    cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
    cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
    cy.switchToDomain('http://idp.com:3500', () => {
      cy.get('[data-cy="username"]').type('BJohnson')
      cy.get('[data-cy="login"]').click()
      cy.get('[data-cy="cannot_find"]') // Timeout here on command stability achieved by primary domain, this command times out.
    })

    // Verify that the user has logged in on localhost
    cy.get('[data-cy="welcome"]') // Stability is false, this command is prevented from running until stability is achieved.
    .invoke('text')
    .should('equal', 'Welcome BJohnson')
  })
})
