/* eslint-disable no-undef */
const send = (win) => {
  return new Cypress.Promise((resolve) => {
    const xhr = new win.XMLHttpRequest

    xhr.open('GET', '/static/foo.js')
    xhr.send()

    xhr.onload = () => {
      return resolve({
        body: xhr.response,
        etag: xhr.getResponseHeader('etag'),
        cacheControl: xhr.getResponseHeader('cache-control'),
      })
    }
  })
}

describe('caching', () => {
  it('does not cache cy.visit file server requests', () => {
    cy.request('POST', 'http://localhost:1515/write/hi')
    cy.visit('/index.html?local')
    cy.get('h1').should('contain', 'hi')
    cy.request('POST', 'http://localhost:1515/write/hello')
    cy.visit('/index.html?local')
    cy.get('h1').should('contain', 'hello')
  })

  it('sets etags on file assets, but no cache-control', () => {
    cy.writeFile('static/foo.js', 'alert(\'hi\')')
    cy.visit('/index.html?local')
    cy.window().then((win) => {
      return send(win)
    }).then((resp1) => {
    // make sure our file server is not telling the browser
    // to cache anything
      expect(resp1.cacheControl).to.eq('public, max-age=0')

      cy.window().then((win) => {
        return send(win)
      }).then((resp2) => {
      // these responses should be identical
        expect(resp1).to.deep.eq(resp2)

        // now change our static files' content
        cy.writeFile('static/foo.js', 'console.log(\'bar\')')
        cy.window().then((win) => {
          return send(win)
        }).then((resp3) => {
        // etags should now no longer match!
          expect(resp1.etag).not.to.eq(resp3.etag)

          // nor should bodies match
          expect(resp1.body).not.to.eq(resp3.body)

          // but cache control should
          expect(resp1.cacheControl).to.eq(resp3.cacheControl)
        })
      })
    })
  })

  it('does not cache cy.visit http server requests', () => {
    // even though our server sends down cache headers
    // we are explicitly turning them off in the proxy
    // whenever we have to inject new content into the page
    cy.request('POST', 'http://localhost:1515/write/hi')
    cy.visit('http://localhost:1515/index.html?http')
    cy.get('h1').should('contain', 'hi')
    cy.request('POST', 'http://localhost:1515/write/foo')
    cy.visit('http://localhost:1515/index.html?http')
    cy.get('h1').should('contain', 'foo')
  })

  it('respects cache control headers from 3rd party http servers', () => {
    cy.writeFile('static/foo.js', 'alert(\'hi\')')
    cy.visit('http://localhost:1515/index.html?http')
    cy.window().then((win) => {
      return send(win)
    }).then((resp1) => {
    // we've set express.static to cache assets
      expect(resp1.cacheControl).to.eq('public, max-age=3600')

      cy.window().then((win) => {
        return send(win)
      }).then((resp2) => {
        // these responses should be identical
        expect(resp1).to.deep.eq(resp2)

        // now change our static files' content
        cy.writeFile('static/foo.js', 'console.log(\'bar\')')
        cy.window().then((win) => {
          return send(win)
        }).then((resp3) => {
          // but because of the cache-control headers
          // our browser should NOT have made a
          // new http request and therefore all of
          // these should still match
          expect(resp1).to.deep.eq(resp3)
        })
      })
    })
  })
})
