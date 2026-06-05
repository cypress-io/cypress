// Reproduces https://github.com/cypress-io/cypress/issues/33233
//
// Changing `baseUrl` to a brand new origin inside a `before` hook and then
// issuing a relative `cy.visit()` forces Cypress to reload the top window to
// the new origin. Because the spec re-runs after every reload, the `before`
// hook runs again and picks yet another unique origin, so the run never
// converges. Prior to the fix this looped (reloaded) forever and hung
// silently. Cypress should now bail out with a clear cross-origin error.
before(() => {
  const uniqueSubdomain = `tenant-${Date.now()}-${Math.floor(Math.random() * 1e6)}`

  Cypress.config('baseUrl', `http://${uniqueSubdomain}.foobar.com:4567`)
})

describe('dynamic baseUrl reload loop', () => {
  it('does not hang forever when baseUrl keeps changing origin', () => {
    cy.visit('/')
  })
})
