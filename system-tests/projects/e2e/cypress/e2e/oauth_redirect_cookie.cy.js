// https://github.com/cypress-io/cypress/issues/29719
//
// Verifies that session cookies set on the primary origin on the *first* page
// visit survive a server-side 302 redirect from a cross-origin OAuth/SSO
// identity provider back to the primary origin's callback URL.
//
// Two things were broken before the fix:
// 1. `shouldAttachAndSetCookies` returned false when currentAUTUrl was
//    undefined (first visit), so the cookie never landed in the server-side
//    tough-cookie jar at all.
// 2. The Chrome CDP frame-tree race during cross-origin navigation could drop
//    the X-Cypress-Is-AUT-Frame header on the redirect-follow request, causing
//    the proxy to skip re-attaching the jar cookies to the callback request.
describe('OAuth redirect-back cookie', () => {
  it('sends primary-origin cookies set on the first visit through an IdP server-side redirect back to the primary origin', () => {
    // Visit the primary origin's login page. The server responds with
    // Set-Cookie: oauth_state=<token>; HttpOnly; Path=/
    // This is the FIRST cy.visit so currentAUTUrl is undefined when the
    // response middleware runs — the fix ensures the cookie still lands in the
    // server-side jar.
    cy.visit('http://localhost:3500/oauth_login')

    // Confirm the cookie was received by the browser.
    cy.getCookie('oauth_state').should('not.be.null')

    // Click the link to navigate to the mock IdP (cross-origin).
    cy.get('[data-cy=login-with-idp]').click()

    // Interact with the mock IdP in the cross-origin context.
    cy.origin('http://www.idp.com:3501', () => {
      cy.get('[data-cy=idp-submit]').click()
      // The IdP issues a server-side 302 → http://localhost:3500/oauth_callback
      // The browser follows the redirect but omits the Lax cookie (cross-site
      // iframe navigation). The proxy fix re-attaches it from the jar.
    })

    // The callback page returns 200 only if it receives the oauth_state cookie.
    cy.get('[data-cy=result]').should('have.text', 'oauth login success')
  })
})
