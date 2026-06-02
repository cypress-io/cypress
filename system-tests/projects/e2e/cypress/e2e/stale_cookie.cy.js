// https://github.com/cypress-io/cypress/issues/25841
// A same-origin fetch/XHR that updates a cookie via Set-Cookie must keep the
// server-side cookie jar in sync. Otherwise the next top-level navigation reads
// a stale value from the jar and overwrites the browser's fresh cookie, causing
// the server to receive (and render) the stale cookie value.
describe('cookie jar stays in sync after same-origin requests', () => {
  const updateCookie = {
    fetch: (win) => win.fetch('/stale_cookie/update', { method: 'POST' }),
    xhr: (win) => {
      return new Promise((resolve) => {
        const xhr = new win.XMLHttpRequest()

        xhr.open('POST', '/stale_cookie/update')
        xhr.onload = resolve
        xhr.send()
      })
    },
  }

  Object.keys(updateCookie).forEach((requestType) => {
    it(`sends the fresh cookie set by a same-origin ${requestType} on the next navigation`, () => {
      // the initial navigation seeds the server-side cookie jar with `flash=stale`
      cy.visit('/stale_cookie')
      cy.get('#flash').should('have.text', 'flash: stale')

      // a same-origin request updates the cookie to a fresh value via Set-Cookie.
      // this updates the browser, and the server-side cookie jar must update too.
      cy.window().then((win) => updateCookie[requestType](win))

      // reloading triggers a navigation that reads cookies from the jar. before
      // the fix the stale jar value overwrote the browser's fresh cookie, so the
      // server received `flash=stale`. it should now receive `flash=fresh`.
      cy.reload()
      cy.get('#flash').should('have.text', 'flash: fresh')
    })
  })
})
