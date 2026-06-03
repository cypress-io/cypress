const { $ } = Cypress

// https://github.com/cypress-io/cypress/issues/27648
// When testIsolation is disabled, the backend state (cy.intercept routes,
// remote states, buffered requests) must persist across tests. Previously,
// `reset:server:state` fired on every `test:before:run:async` and wiped the
// routes - including a route registered in a `before` hook - causing
// `cy.wait('@alias')` to fail with "no request ever occurred".
describe('issue 27648: intercepts persist across tests when testIsolation is disabled', { testIsolation: false }, () => {
  const url = '/issue-27648-resource'

  before(() => {
    // registering the intercept in a `before` hook is the key scenario:
    // the hook body runs before the first test's `test:before:run:async`,
    // so an unconditional backend reset would wipe this route immediately.
    cy.intercept('GET', url, {
      body: { ok: true },
      headers: { 'content-type': 'application/json' },
    }).as('getResource')

    cy.visit('http://localhost:3500/fixtures/jquery.html')
  })

  it('matches the intercept in the first test', () => {
    cy.window().then(() => {
      return new Promise<void>((resolve) => {
        $.get(url).done(() => resolve())
      })
    })

    cy.wait('@getResource').its('response.body').should('deep.equal', { ok: true })
  })

  it('still matches the same intercept in a subsequent test', () => {
    // without the fix, the route registered in `before` has been wiped by the
    // per-test `reset:server:state`, so this `cy.wait` would time out.
    cy.window().then(() => {
      return new Promise<void>((resolve) => {
        $.get(url).done(() => resolve())
      })
    })

    cy.wait('@getResource').its('response.body').should('deep.equal', { ok: true })
  })
})
