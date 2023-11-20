/**
 * Used in sessions_spec system-tests tests. Throws cross-origin errors
 * cy-in-cy tests in @packages/app.
 *
 * This is part 2 of the session persist spec
 * This part makes sure spec session data is cleared between specs
 * and global session data is persisted between specs in run mode.
 */

it('restores global session from last spec', () => {
  cy.login('global_1', true)
  if (Cypress.env('SYSTEM_TESTS')) {
    cy.get(top.document).within(() => {
      cy.contains('.test', 'restores global session ').as('restores_global_session').click()
      cy.get('@restores_global_session').within(() => {
        cy.get('.command-name-session').should('contain', 'global_1')
        .find('.reporter-tag').should('contain', 'restored')
      })
    })
  }

  cy.getCookie('token').then((cookie) => {
    expect(cookie.value).to.eq('1')
  })
})

it('creates spec session since it is a new spec', () => {
  cy.login('spec_session', false)

  if (Cypress.env('SYSTEM_TESTS')) {
    cy.get(top.document).within(() => {
      cy.contains('.test', 'creates spec session').as('creates_spec_session').click()
      cy.get('@creates_spec_session').within(() => {
        cy.get('.command-name-session').should('contain', 'spec_session')
        .find('.reporter-tag').should('contain', 'created')
      })
    })
  }

  cy.getCookie('token').then((cookie) => {
    expect(cookie.value).to.eq('2')
  })
})
