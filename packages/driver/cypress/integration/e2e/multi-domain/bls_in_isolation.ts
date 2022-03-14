// @ts-nocheck / session support is needed for visiting about:blank between tests
describe('Multi-step Auth in isolation', { experimentalSessionSupport: true }, () => {
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

  it('final-auth redirects back to localhost - flat', () => {
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
