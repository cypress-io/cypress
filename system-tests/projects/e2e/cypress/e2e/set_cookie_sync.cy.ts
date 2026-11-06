// https://github.com/cypress-io/cypress/issues/34902
//
// Chrome applies a response's Set-Cookie headers before pausing it for Fetch
// interception, and neither continuing nor fulfilling the response undoes that.
// The browser's cookie store has to match the headers the handler leaves,
// including on a redirect hop.
//
// Most tests request their endpoint with fetch. cy.visit requests the page from
// Node, copies its cookies into Chrome over automation and answers Chrome's
// navigation from that buffered response, so Chrome never pauses a response or
// reports what it stored from one, and the cookie sync never runs.
const fetchText = (url: string, init?: RequestInit) => {
  return cy.window().then((win) => win.fetch(url, init).then((res) => res.text()))
}

const originOn = (hostname: string) => {
  const url = new URL(Cypress.config('baseUrl')!)

  url.hostname = hostname

  return url.origin
}

const setCookieLines = (res: { headers: Record<string, string | string[]> }) => {
  return ([] as string[]).concat(res.headers['set-cookie'] || [])
}

// /cookie_sync/page sets kept=origin and dropped=origin. The handler rewrites
// one, drops the other and adds a third.
const rewritePageCookies = ({ body }: { body?: string } = {}) => {
  cy.intercept('/cookie_sync/page', (req) => {
    req.on('response', (res) => {
      expect(setCookieLines(res)).to.deep.eq(['kept=origin; Path=/', 'dropped=origin; Path=/'])

      if (body !== undefined) {
        res.body = body
      }

      res.headers['set-cookie'] = ['kept=rewritten; Path=/', 'added=1; Path=/']
    })
  })
}

const expectPageCookies = () => {
  cy.getCookie('kept').its('value').should('eq', 'rewritten')
  cy.getCookie('added').its('value').should('eq', '1')
  cy.getCookie('dropped').should('be.null')
}

describe('cy.intercept rewrites Set-Cookie headers', () => {
  beforeEach(() => {
    cy.visit('/cookie_sync/no_cookies')
  })

  // the dashboard renders the cookie Chrome sent when following the redirect,
  // so it also shows the sync finished before the hop was released
  it('keeps a value the handler rewrote on a redirect response', () => {
    cy.intercept('/cookie_sync/login', (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq(['session=plain; Path=/'])

        res.headers['set-cookie'] = ['session=rewritten; Path=/']
      })
    })

    fetchText('/cookie_sync/login').should('contain', 'session: rewritten')

    cy.getCookie('session').its('value').should('eq', 'rewritten')
  })

  // the baseline here is the cookie Chrome sent with the request, so this
  // covers reading it back on a redirect hop
  it('keeps the earlier cookie when the handler drops a header that would have revoked it', () => {
    cy.setCookie('session', 'plain')

    cy.intercept('/cookie_sync/revoke', (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq(['session=; Max-Age=0; Path=/'])

        delete res.headers['set-cookie']
      })
    })

    fetchText('/cookie_sync/revoke').should('contain', 'session: plain')

    cy.getCookie('session').its('value').should('eq', 'plain')
  })

  // Chrome reports the earlier cookie with the request even though its path
  // doesn't match, so the sync can put it back
  it('keeps the earlier cookie on another path when the handler drops the header that overwrote it', () => {
    cy.setCookie('scoped', 'plain', { path: '/cookie_sync/elsewhere' })

    cy.intercept('/cookie_sync/other_path', (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq(['scoped=origin; Path=/cookie_sync/elsewhere'])

        delete res.headers['set-cookie']
      })
    }).as('otherPath')

    fetchText('/cookie_sync/other_path')
    cy.wait('@otherPath')

    cy.getCookies().then((cookies) => cookies.find(({ name }) => name === 'scoped'))
    .should('include', { value: 'plain', path: '/cookie_sync/elsewhere' })
  })

  it('stores no cookie when the handler deletes the header', () => {
    cy.intercept('/cookie_sync/plain', (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq(['tracking=1; Path=/'])

        delete res.headers['set-cookie']
      })
    }).as('plain')

    fetchText('/cookie_sync/plain')
    cy.wait('@plain')

    cy.getCookie('tracking').should('be.null')
  })

  // Chrome ignores Set-Cookie on a response to a request sent without
  // credentials, so the handler's cookies must not be written past that
  it('stores nothing from a response to a request sent without credentials', () => {
    cy.intercept('/cookie_sync/plain', (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq(['tracking=1; Path=/'])

        res.headers['set-cookie'] = ['tracking=2; Path=/', 'added=1; Path=/']
      })
    }).as('plain')

    fetchText('/cookie_sync/plain', { credentials: 'omit' })
    cy.wait('@plain')

    cy.getCookie('tracking').should('be.null')
    cy.getCookie('added').should('be.null')
  })

  // Chrome ignored the origin's tracking=1, so the tracking=1 in its store is
  // the one set before the request, and dropping the header must not delete it
  it('keeps a cookie the origin re-sent unchanged when the handler drops it from a request sent without credentials', () => {
    cy.setCookie('tracking', '1')

    cy.intercept('/cookie_sync/plain', (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq(['tracking=1; Path=/'])

        delete res.headers['set-cookie']
      })
    }).as('plain')

    fetchText('/cookie_sync/plain', { credentials: 'omit' })
    cy.wait('@plain')

    cy.getCookie('tracking').its('value').should('eq', '1')
  })

  // Chrome blocks the origin's SameSite=Lax cookie on a cross-site response,
  // and the handler's SameSite=None rewrite must still be stored.
  it('stores a cookie Chrome blocked once the handler rewrites it to SameSite=None', () => {
    const crossSiteUrl = `${originOn('127.0.0.1')}/cookie_sync/cross_site`

    cy.intercept(crossSiteUrl, (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq(['tracking=1; Path=/; SameSite=Lax'])

        res.headers['set-cookie'] = ['tracking=1; Path=/; SameSite=None; Secure']
      })
    }).as('crossSite')

    // Chrome only stores cookies from a cross-origin response on a credentialed request
    fetchText(crossSiteUrl, { credentials: 'include' })
    cy.wait('@crossSite')

    cy.getCookie('tracking', { domain: '127.0.0.1' }).should((cookie) => {
      expect(cookie).to.include({ value: '1', sameSite: 'no_restriction', secure: true })
    })
  })

  // Replacing the body fulfills the response. Chrome is expected to store the
  // handler's Set-Cookie headers from that fulfilled response; the sync only
  // removes cookies the origin set that the handler dropped.
  it('stores the handler\'s cookies when it also replaces the response body', () => {
    rewritePageCookies({ body: 'stubbed' })

    fetchText('/cookie_sync/page').should('eq', 'stubbed')

    expectPageCookies()
  })

  // Cypress injects into an AUT document, which fulfills the response the same
  // way replacing the body does
  it('stores the handler\'s cookies for a page the AUT navigates to', () => {
    rewritePageCookies()

    cy.window().then((win) => {
      win.location.href = '/cookie_sync/page'
    })

    cy.contains('#page', 'origin')
    expectPageCookies()
  })

  // the sync doesn't run on this path, so this covers the automation that
  // copies the visited page's cookies into Chrome
  it('stores the handler\'s cookies for a page cy.visit loads', () => {
    rewritePageCookies()

    cy.visit('/cookie_sync/page')

    cy.contains('#page', 'origin')
    expectPageCookies()
  })

  it('keeps a cookie Chrome blocked out of the store while syncing another', () => {
    cy.intercept('/cookie_sync/blocked', (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq(['blocked=1; Path=/; SameSite=None', 'kept=origin; Path=/'])

        res.headers['set-cookie'] = ['blocked=1; Path=/; SameSite=None', 'kept=rewritten; Path=/']
      })
    }).as('blocked')

    fetchText('/cookie_sync/blocked')
    cy.wait('@blocked')

    cy.getCookie('kept').its('value').should('eq', 'rewritten')
    cy.getCookie('blocked').should('be.null')
  })

  // The handler's last line for the cookie is the one Chrome blocked, so the
  // repeated=3 before it is what Chrome would store. The sync has to skip the
  // blocked line to see that; otherwise it matches the origin's last line and
  // leaves Chrome holding repeated=1.
  it('writes the handler\'s last cookie for a name that Chrome would not block', () => {
    cy.intercept('/cookie_sync/blocked_repeat', (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq(['repeated=1; Path=/', 'repeated=2; Path=/; SameSite=None'])

        res.headers['set-cookie'] = ['repeated=3; Path=/', 'repeated=2; Path=/; SameSite=None']
      })
    }).as('blockedRepeat')

    fetchText('/cookie_sync/blocked_repeat')
    cy.wait('@blockedRepeat')

    cy.getCookie('repeated').its('value').should('eq', '3')
  })

  // Chrome fetches the rewritten url and stores the origin's cookies against
  // its host, so the sync has to target that host and not the page's
  it('syncs cookies against the host a request handler rewrote req.url to', () => {
    const otherHost = '127.0.0.1'

    cy.intercept('/cookie_sync/original', (req) => {
      const url = new URL(req.url)

      url.hostname = otherHost
      url.pathname = '/cookie_sync/rewritten'
      req.url = url.toString()

      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq([
          'foo=origin; Path=/; SameSite=None; Secure',
          'bar=origin; Path=/; SameSite=None; Secure',
        ])

        // expire foo in place rather than filtering it out: the handler's array
        // keeps its length, so this exercises only which host the sync targets
        res.headers['set-cookie'] = [
          'foo=; Max-Age=0; Path=/; SameSite=None; Secure',
          'bar=rewritten; Path=/; SameSite=None; Secure',
        ]
      })
    }).as('original')

    // the rewritten host is cross-site to the page, so Chrome only stores its
    // cookies on a credentialed request
    fetchText('/cookie_sync/original', { credentials: 'include' }).should('contain', 'rewritten')

    cy.wait('@original')
    cy.getCookie('foo', { domain: otherHost }).should('be.null')
    cy.getCookie('bar', { domain: otherHost }).its('value').should('eq', 'rewritten')
    cy.getCookie('foo', { domain: 'localhost' }).should('be.null')
    cy.getCookie('bar', { domain: 'localhost' }).should('be.null')
  })
})

// the page has to be on the cookie's host, so each test visits it first
describe('cy.intercept rewrites Set-Cookie headers with a Domain= attribute', () => {
  const fetchDomainCookie = ({ pageHost, cookieDomain, rewriteSetCookie, deleteSetCookie = false }: {
    pageHost: string
    cookieDomain: string
    rewriteSetCookie?: (lines: string[]) => string[]
    deleteSetCookie?: boolean
  }) => {
    cy.intercept('/cookie_sync/domain*', (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq([`a=origin; Domain=${cookieDomain}; Path=/`])

        if (deleteSetCookie) {
          delete res.headers['set-cookie']
        } else if (rewriteSetCookie) {
          res.headers['set-cookie'] = rewriteSetCookie(setCookieLines(res))
        }
      })
    }).as('domain')

    cy.visit(`${originOn(pageHost)}/cookie_sync/no_cookies`)

    fetchText(`/cookie_sync/domain?domain=${cookieDomain}`)
    cy.wait('@domain')
  }

  const rewrite = (lines: string[]) => lines.map((line) => line.replace('a=origin', 'a=rewritten'))

  // a second copy of `a` under another domain fails this too
  const expectOnlyCookieA = (expected: { value: string, domain: string }) => {
    cy.getCookies().should((cookies) => {
      const copiesOfA = cookies.filter(({ name }) => name === 'a').map(({ value, domain }) => ({ value, domain }))

      expect(copiesOfA).to.deep.eq([expected])
    })
  }

  it('stores a rewritten cookie as a domain cookie', () => {
    fetchDomainCookie({ pageHost: 'www.bar.foo.com', cookieDomain: 'foo.com', rewriteSetCookie: rewrite })
    expectOnlyCookieA({ value: 'rewritten', domain: '.foo.com' })
  })

  it('removes a domain cookie the handler drops', () => {
    fetchDomainCookie({ pageHost: 'www.bar.foo.com', cookieDomain: 'foo.com', deleteSetCookie: true })
    cy.getCookie('a').should('be.null')
  })

  // Chrome stores Domain=<public suffix> host-only, under the bare host
  it('stores a rewritten cookie host-only when the domain is a public suffix', () => {
    fetchDomainCookie({ pageHost: 'co.uk', cookieDomain: 'co.uk', rewriteSetCookie: rewrite })
    expectOnlyCookieA({ value: 'rewritten', domain: 'co.uk' })
  })

  // Domain=localhost and no Domain= name the same host-only cookie, so the
  // removal of the origin's cookie must not undo the handler's write
  it('keeps the rewritten value when the handler removes Domain=localhost', () => {
    fetchDomainCookie({ pageHost: 'localhost', cookieDomain: 'localhost', rewriteSetCookie: () => ['a=rewritten; Path=/'] })
    expectOnlyCookieA({ value: 'rewritten', domain: 'localhost' })
  })
})

// Chrome adds its stored cookies to a request whose Cookie header is missing
// from Fetch.continueRequest, so a handler's deletion has to reach the server
// as an empty header
describe('cy.intercept removes the Cookie header from a request', () => {
  it('sends the request without the browser\'s cookies', () => {
    cy.visit('/cookie_sync/no_cookies')
    cy.setCookie('session', 'plain')

    cy.intercept('/cookie_sync/dashboard', (req) => {
      expect(req.headers.cookie).to.eq('session=plain')

      delete req.headers.cookie
    })

    fetchText('/cookie_sync/dashboard').should('contain', 'session: none')

    // deleting req.headers.cookie changes only what this request sends, not
    // the cookies Chrome stores
    cy.getCookie('session').its('value').should('eq', 'plain')
  })
})

// When the AUT isn't on the primary origin, the proxy also adds the handler's
// cookies to Chrome over automation, so the sync isn't the only writer. The
// AUT is a cross-site iframe there, so Chrome only stores the origin's
// SameSite=None; Secure cookies, which 127.0.0.1 allows over http.
describe('cy.intercept rewrites Set-Cookie headers in cy.origin', () => {
  // /cookie_sync/rewritten sets foo=origin and bar=origin
  beforeEach(() => {
    cy.intercept({ pathname: '/cookie_sync/rewritten' }, (req) => {
      req.on('response', (res) => {
        expect(setCookieLines(res)).to.deep.eq([
          'foo=origin; Path=/; SameSite=None; Secure',
          'bar=origin; Path=/; SameSite=None; Secure',
        ])

        res.headers['set-cookie'] = [
          'bar=rewritten; Path=/; SameSite=None; Secure',
          'added=1; Path=/; SameSite=None; Secure',
        ]
      })
    }).as('rewritten')
  })

  const expectRewrittenCookies = () => {
    cy.origin(originOn('127.0.0.1'), () => {
      cy.getCookie('bar').its('value').should('eq', 'rewritten')
      cy.getCookie('added').its('value').should('eq', '1')
      cy.getCookie('foo').should('be.null')
    })
  }

  it('stores the handler\'s cookies for a page the AUT navigates to', () => {
    cy.origin(originOn('127.0.0.1'), () => {
      cy.visit('/cookie_sync/no_cookies')
      cy.window().then((win) => {
        win.location.href = '/cookie_sync/rewritten'
      })

      cy.contains('#page', 'rewritten')
    })

    expectRewrittenCookies()
  })

  it('stores the handler\'s cookies from a fetch', () => {
    cy.origin(originOn('127.0.0.1'), () => {
      cy.visit('/cookie_sync/no_cookies')
      cy.window().then((win) => win.fetch('/cookie_sync/rewritten').then((res) => res.text()))
    })

    cy.wait('@rewritten')
    expectRewrittenCookies()
  })
})
