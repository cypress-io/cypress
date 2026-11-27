// https://github.com/cypress-io/cypress/issues/34704
//
// Requests come from the page (fetch, a link click, EventSource), not from
// cy.visit. cy.visit requests the URL from Node, follows redirects there and
// answers Chrome's navigation from that buffered response, so Chrome never
// pauses the redirect.
const fetchFollowing = (url: string, init: RequestInit = {}) => {
  return cy.window().then((win) => {
    return win.fetch(url, { credentials: 'include', ...init }).then(async (res) => {
      const { host, pathname } = new URL(res.url)

      return { status: res.status, host, path: pathname, body: await res.text() }
    })
  })
}

// Same server, but cross-site from the page on localhost
const CROSS_SITE = Cypress.config('baseUrl')!.replace('localhost', '127.0.0.1')

const rewriteLocation = (url: string, location: string) => {
  cy.intercept(url, (req) => {
    req.on('response', (res) => {
      res.headers.location = location
    })
  })
}

describe('cy.intercept rewrites a redirect Location', () => {
  beforeEach(() => {
    cy.visit('/intercept_redirect/page')
  })

  it('a link navigation follows the rewritten Location', () => {
    rewriteLocation('/intercept_redirect/302', '/intercept_redirect/rewritten')

    cy.get('#go').click()
    cy.location('pathname').should('eq', '/intercept_redirect/rewritten')
    cy.contains('h1', 'rewritten')
  })

  it('applies a rewritten Location and an edited Set-Cookie together', () => {
    cy.intercept('/intercept_redirect/302_cookie', (req) => {
      req.on('response', (res) => {
        res.headers.location = '/intercept_redirect/rewritten'
        res.headers['set-cookie'] = ['redirected=handler; Path=/']
      })
    })

    fetchFollowing('/intercept_redirect/302_cookie').its('path').should('eq', '/intercept_redirect/rewritten')
    cy.getCookie('redirected').its('value').should('eq', 'handler')
  })

  it('follows the origin Location when the handler only spies', () => {
    cy.intercept('/intercept_redirect/302').as('redirect')

    fetchFollowing('/intercept_redirect/302').its('path').should('eq', '/intercept_redirect/original')
    cy.wait('@redirect').its('response.statusCode').should('eq', 302)
  })

  // EventSource requests are stream-shaped, so no hop has its body read, the
  // redirect included. A rewritten Location must still be fulfilled when the
  // body was skipped.
  it('an EventSource follows the rewritten Location', () => {
    rewriteLocation('/intercept_redirect/events', '/intercept_redirect/events_rewritten')

    cy.window().then((win) => {
      return new Cypress.Promise<string>((resolve, reject) => {
        const source = new win.EventSource('/intercept_redirect/events')

        source.onmessage = (e) => {
          source.close()
          resolve(e.data)
        }

        // EventSource retries on its own after an error, which would turn a
        // failed redirect into an unexplained timeout.
        source.onerror = () => {
          source.close()
          reject(new Error(`EventSource for ${source.url} failed before a message arrived`))
        }
      })
    }).should('eq', 'events_rewritten')
  })

  describe('across sites', () => {
    it('a cross-site fetch follows the rewritten Location', () => {
      rewriteLocation(`${CROSS_SITE}/intercept_redirect/302`, '/intercept_redirect/rewritten')

      fetchFollowing(`${CROSS_SITE}/intercept_redirect/302`).then(({ host, path, body }) => {
        expect(host).to.eq(new URL(CROSS_SITE).host)
        expect(path).to.eq('/intercept_redirect/rewritten')
        expect(body).to.contain('rewritten')
      })
    })

    it('follows a Location rewritten to another site', () => {
      rewriteLocation('/intercept_redirect/302', `${CROSS_SITE}/intercept_redirect/rewritten`)

      fetchFollowing('/intercept_redirect/302').then(({ host, path }) => {
        expect(host).to.eq(new URL(CROSS_SITE).host)
        expect(path).to.eq('/intercept_redirect/rewritten')
      })
    })
  })

  // A 301 or 302 turns a POST into a GET, as does a 303. A 307 or 308 resends
  // the POST and its body.
  for (const { status, method, body } of [
    { status: 301, method: 'GET', body: '' },
    { status: 302, method: 'GET', body: '' },
    { status: 303, method: 'GET', body: '' },
    { status: 307, method: 'POST', body: 'payload' },
    { status: 308, method: 'POST', body: 'payload' },
  ]) {
    it(`a POST redirected by a ${status} reaches the rewritten Location as a ${method}`, () => {
      rewriteLocation(`/intercept_redirect/status/${status}`, '/intercept_redirect/echo/rewritten')

      fetchFollowing(`/intercept_redirect/status/${status}`, {
        method: 'POST',
        body: 'payload',
        headers: { 'content-type': 'text/plain' },
      }).its('body').then((text) => JSON.parse(text)).should('deep.equal', {
        name: 'rewritten',
        method,
        body,
      })
    })
  }

  describe('Referrer-Policy', () => {
    const fetchReferer = () => fetchFollowing('/intercept_redirect/to_referer').its('body').then((text) => JSON.parse(text).referer)

    // Proves the page sends a Referer at all, so the rewrite test below can't
    // pass for the wrong reason.
    it('follows a redirect with the page as the Referer when the handler only spies', () => {
      cy.intercept('/intercept_redirect/to_referer').as('redirect')

      fetchReferer().should('contain', '/intercept_redirect/page')
      cy.wait('@redirect')
    })

    it('follows a redirect with the Referrer-Policy the handler sets', () => {
      cy.intercept('/intercept_redirect/to_referer', (req) => {
        req.on('response', (res) => {
          res.headers['referrer-policy'] = 'no-referrer'
        })
      })

      fetchReferer().should('be.null')
    })
  })

  it('returns the redirect itself when the handler removes its Location', () => {
    cy.intercept('/intercept_redirect/302', (req) => {
      req.on('response', (res) => {
        delete res.headers.location
      })
    })

    fetchFollowing('/intercept_redirect/302').then(({ status, path }) => {
      expect(status).to.eq(302)
      expect(path).to.eq('/intercept_redirect/302')
    })
  })

  // Without an origin Location, Chrome pauses at response-received rather than
  // redirect-received, so the added Location is applied before it decides
  // whether to redirect.
  it('follows a Location added to a redirect status that had none', () => {
    rewriteLocation('/intercept_redirect/302_no_location', '/intercept_redirect/rewritten')

    fetchFollowing('/intercept_redirect/302_no_location').then(({ status, path }) => {
      expect(status).to.eq(200)
      expect(path).to.eq('/intercept_redirect/rewritten')
    })
  })

  // /chain -> /302 (rewritten) -> /to_rewritten -> /rewritten puts an origin hop
  // on each side of the one the rewrite fulfills.
  it('follows a rewritten Location in the middle of a redirect chain', () => {
    rewriteLocation('/intercept_redirect/302', '/intercept_redirect/to_rewritten')

    fetchFollowing('/intercept_redirect/chain').its('path').should('eq', '/intercept_redirect/rewritten')
  })
})
