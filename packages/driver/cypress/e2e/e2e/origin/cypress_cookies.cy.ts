// These tests run in order: the first leaves `__cypress.unload` on its origin
// for the second to find.
describe('Cypress cookies left on a former top origin', { browser: '!webkit', testIsolation: true }, () => {
  const originUrl = 'https://www.foobar.com:3502'

  it('keeps the unload cookie when top leaves the origin', () => {
    cy.visit(`${originUrl}/fixtures/generic.html`)

    // Stops the runner clearing the cookie it set on `beforeunload`
    cy.then(() => {
      for (const event of ['unload', 'pagehide']) {
        window.top!.addEventListener(event, (e) => e.stopImmediatePropagation(), true)
      }
    })
  })

  it('does not send the unload cookie with the app\'s requests', () => {
    cy.intercept(`${originUrl}/test-request`).as('req')

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cookie-https"]').click()

    cy.origin(originUrl, { args: originUrl }, (originUrl) => {
      cy.window().then((win) => {
        return cy.wrap(win.fetch(`${originUrl}/test-request`))
      })
    })

    cy.wait('@req').its('request.headers.cookie').should('be.undefined')
  })
})
