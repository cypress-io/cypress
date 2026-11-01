// The AUT is cross-origin, so code reaches it as an inline handler rather than through cy.window()
const runInAut = (code: string) => {
  cy.get('body').invoke('attr', 'onclick', `document.body.removeAttribute('onclick'); ${code}`)
  cy.get('body').trigger('click', { force: true })
}

// These tests run in order: the second checks that a cookie the first left in
// the server's cookie jar, but not in the browser, is cleared between tests.
describe('remote driver: server cookie jar between isolated tests in a cross-origin AUT', { experimentalRemoteDriver: true, testIsolation: true, retries: 0 }, () => {
  const originUrl = 'https://www.foobar.com:3502'

  it('leaves a cookie in the jar after the app deletes it from the browser', () => {
    cy.visit(`${originUrl}/fixtures/generic.html`)

    runInAut(`fetch('${originUrl}/set-cookie?cookie=foo1=bar1; Domain=foobar.com')`)

    cy.getAllCookies().should('have.length', 1)

    // Removes the cookie from the browser, but not from the server's jar
    runInAut(`document.cookie = 'foo1=; Domain=foobar.com; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'`)

    cy.getAllCookies().should('have.length', 0)
  })

  it('does not send the previous test\'s jar cookie', () => {
    cy.intercept(`${originUrl}/test-request`).as('req')

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cookie-https"]').click()

    runInAut(`fetch('${originUrl}/test-request')`)

    cy.wait('@req').its('request.headers.cookie').should('be.undefined')
  })
})

export {}
