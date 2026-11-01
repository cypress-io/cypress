import dayjs from 'dayjs'

// The AUT is cross-origin, so code reaches it as an inline handler rather than through cy.window()
const runInAut = (code: string) => {
  cy.get('body').invoke('attr', 'onclick', `document.body.removeAttribute('onclick'); ${code}`)
  cy.get('body').trigger('click', { force: true })
}

const setDocumentCookie = (cookie: string) => {
  runInAut(`document.cookie = ${JSON.stringify(cookie)}`)
}

// .its() runs in the remote driver's isolated world, which doesn't see the page's own document.cookie,
// so the page copies it to an attribute until it unloads
const documentCookie = () => {
  runInAut(`
    const copy = () => { document.body.dataset.documentCookie = document.cookie }
    copy()
    setInterval(copy, 50)
  `)

  return cy.get('body').invoke('attr', 'data-document-cookie')
}

describe('remote driver: cookie login in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  const { _ } = Cypress
  // ensures unique username so there's no risk of false positives from
  // test pollution
  const getUsername = () => _.uniqueId('user')

  const verifyLoggedIn = (username, { cookieKey } = { cookieKey: 'user' }) => {
    cy.get('h1').invoke('text').should('equal', `Welcome, ${username}!`)
    cy.getCookie(cookieKey).its('value').should('equal', username)
  }

  const verifyIdpNotLoggedIn = (config = {}) => {
    const { isHttps, cookieKey, expectNullCookie, subdomain } = _.defaults(config, {
      isHttps: false,
      cookieKey: 'user',
      expectNullCookie: true,
      subdomain: 'www',
    })
    const port = isHttps ? '3502' : '3501'

    cy.location('host').should('equal', `${subdomain}.idp.com:${port}`)
    cy.get('h1')
    .invoke('text')
    .should('equal', 'Not logged in')

    if (expectNullCookie) {
      cy.getCookie(cookieKey).should('be.null')
    }
  }

  const verifyLocalhostNotLoggedIn = () => {
    cy.get('h1').invoke('text').should('equal', 'No user found')
  }

  const login = (username: string, { cookieProps, localhostCookieProps, cookieKey }: { cookieProps?: string, localhostCookieProps?: string, cookieKey?: string } = {}) => {
    cy.get('[data-cy="username"]').type(username)

    if (cookieKey) {
      cy.get('[data-cy="cookieKey"]').clear().type(cookieKey)
    }

    if (cookieProps) {
      cy.get('[data-cy="cookieProps"]').type(cookieProps)
    }

    if (localhostCookieProps) {
      cy.get('[data-cy="localhostCookieProps"]').type(localhostCookieProps)
    }

    cy.get('[data-cy="login"]').click()
  }

  beforeEach(() => {
    // makes it nice and readable even on a small screen with devtools open :)
    cy.viewport(300, 400)
  })

  /****************************************************************************
    Cookie Login Flow
    - localhost/fixtures/primary-origin.html:
      ◦ click link to localhost/fixtures/prelogin
    - localhost/prelogin:
      ◦ sets cookie "prelogin" on localhost
      ◦ redirects to foobar.com/fixtures/auth/cookie-login.html
    - foobar.com/fixtures/auth/cookie-login.html:
      ◦ submit login form
      ◦ client-side redirects to idp.com/cookie-login
    - idp.com/cookie-login:
      ◦ attempts to sets "user" cookie on idp.com
      ◦ server-side redirects to idp.com/verify-cookie-login
    - idp.com/verify-cookie-login
      ◦ if "user" cookie is not included in request
        • stops flow, displays "Not logged in"
      ◦ else
        • client-side redirects to localhost/login
    - localhost/login:
      ◦ if "prelogin" cookie is not included in request
        • stops flow, displays "Social login failed"
      ◦ else
        • attempts to set "user" cookie on localhost
        • server-side redirects to localhost/welcome
    - localhost/welcome
      ◦ if "user" cookie is not included in request
        • displays "No user found"
      ◦ else
        • displays "Welcome, <username>"
  ****************************************************************************/

  describe('general behavior', () => {
    let username

    beforeEach(() => {
      username = getUsername()
    })

    it('works in a session', () => {
      cy.session(username, () => {
        cy.visit('/fixtures/primary-origin.html')
        cy.get('[data-cy="cookie-login"]').click()
        login(username)

        // the login ends in a redirect the page starts once it loads
        verifyLoggedIn(username)
      }, {
        validate () {
          cy.getCookie('user').its('value').should('equal', username)
        },
      })

      cy.visit('/welcome')
      verifyLoggedIn(username)
    })

    it('works with aliased localhost', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login-alias"]').click()
      login(username)

      verifyLoggedIn(username)
    })

    it('handles browser-sent cookies being overridden by server-kept cookies', () => {
      cy.visit('https://localhost:3502/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login-override"]').click()
      login(username)

      verifyLoggedIn(username)
    })

    it('cy.clearCookie() -> not logged in', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login"]').click()
      login(username)
      verifyLoggedIn(username)

      cy.clearCookie('user')
      cy.reload()
      verifyLocalhostNotLoggedIn()
    })

    it('cy.clearCookies() -> not logged in', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login"]').click()
      login(username)
      verifyLoggedIn(username)

      cy.clearCookies()
      cy.reload()
      verifyLocalhostNotLoggedIn()
    })
  })

  describe('SameSite', () => {
    let username

    beforeEach(() => {
      username = getUsername()

      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login"]').click()
    })

    it('no SameSite (defaults to Lax) -> logged in', () => {
      login(username)

      verifyLoggedIn(username)
    })

    it('SameSite=Lax -> logged in', () => {
      login(username, { cookieProps: 'SameSite=Lax' })

      verifyLoggedIn(username)
    })

    it('SameSite=Strict -> not logged in', () => {
      login(username, { cookieProps: 'SameSite=Strict' })

      // SameSite=Strict does not allow any cross-origin requests. cookie still
      // gets set but not applied to request
      verifyIdpNotLoggedIn({ expectNullCookie: false })
    })

    it('SameSite=None -> not logged in', () => {
      login(username, { cookieProps: 'SameSite=None' })

      // SameSite=None requires Secure flag
      verifyIdpNotLoggedIn()
    })

    it('invalid SameSite (defaults to Lax) -> logged in', () => {
      login(username, { cookieProps: 'SameSite=Invalid' })

      verifyLoggedIn(username)
    })
  })

  describe('Secure', () => {
    let username

    beforeEach(() => {
      username = getUsername()
    })

    it('Secure + https -> logged in', () => {
      cy.visit('https://localhost:3502/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login-https"]').click()
      login(username, { cookieProps: 'Secure' })

      verifyLoggedIn(username)
    })

    it('Secure + http -> not logged in', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login"]').click()
      login(username, { cookieProps: 'Secure' })

      // Secure flag requires https. cookie still gets set but not applied to
      // request
      verifyIdpNotLoggedIn({ expectNullCookie: false })
    })

    it('no Secure + https -> logged in', () => {
      cy.visit('https://localhost:3502/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login-https"]').click()
      login(username)

      verifyLoggedIn(username)
    })

    it('no Secure + http -> logged in', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login"]').click()
      login(username)

      verifyLoggedIn(username)
    })
  })

  describe('Domain', () => {
    let username

    beforeEach(() => {
      username = getUsername()

      cy.visit('/fixtures/primary-origin.html')
    })

    it('no Domain + superdomain -> logged in', () => {
      cy.get('[data-cy="cookie-login"]').click()
      login(username)

      verifyLoggedIn(username)
    })

    it('no Domain + subdomain -> logged in', () => {
      cy.get('[data-cy="cookie-login-subdomain"]').click()
      login(username)

      verifyLoggedIn(username)
    })

    it('Domain + superdomain -> logged in', () => {
      cy.get('[data-cy="cookie-login"]').click()
      login(username, { cookieProps: 'Domain=idp.com', localhostCookieProps: 'Domain=localhost' })

      verifyLoggedIn(username)
    })

    it('Domain + subdomain -> logged in', () => {
      cy.get('[data-cy="cookie-login-subdomain"]').click()
      login(username, { cookieProps: 'Domain=idp.com', localhostCookieProps: 'Domain=localhost' })

      verifyLoggedIn(username)
    })

    it('subdomain Domain + superdomain -> not logged in', () => {
      cy.get('[data-cy="cookie-login"]').click()
      login(username, { cookieProps: 'Domain=baz.idp.com', localhostCookieProps: 'Domain=localhost' })

      // Domain=subdomain requires request to be on that subdomain
      verifyIdpNotLoggedIn()
    })

    it('subdomain Domain + subdomain -> logged in', () => {
      cy.get('[data-cy="cookie-login-subdomain"]').click()
      login(username, { cookieProps: 'Domain=baz.idp.com', localhostCookieProps: 'Domain=localhost' })

      verifyLoggedIn(username)
    })

    it('subdomain Domain + different subdomain -> not logged in', () => {
      cy.get('[data-cy="cookie-login-subdomain"]').click()
      login(username, { cookieProps: 'Domain=qux.foobar.com' })

      // Domain=subdomain requires request to be on that subdomain
      verifyIdpNotLoggedIn({
        'subdomain': 'baz',
      })
    })
  })

  describe('Path', () => {
    let username

    beforeEach(() => {
      username = getUsername()

      cy.visit('/fixtures/primary-origin.html')
    })

    it('path matches -> logged in', () => {
      cy.get('[data-cy="cookie-login"]').click()
      login(username, { cookieProps: 'Path=/verify-cookie-login', localhostCookieProps: 'Path=/welcome' })

      verifyLoggedIn(username)
    })

    it('path does not match -> not logged in', () => {
      cy.get('[data-cy="cookie-login"]').click()
      login(username, { cookieProps: 'Path=/nope' })

      // path of request must match path of cookie. cookie still gets set but
      // not applied to request
      verifyIdpNotLoggedIn({ expectNullCookie: false })
    })
  })

  describe('Expires', () => {
    let username

    beforeEach(() => {
      username = getUsername()

      cy.visit('/fixtures/primary-origin.html')
    })

    it('expired -> not logged in', () => {
      cy.get('[data-cy="cookie-login"]').click()
      login(username, { localhostCookieProps: `Expires=${(new Date()).toUTCString()}` })

      verifyLocalhostNotLoggedIn()
    })

    it('expired -> not accessible via cy.getCookie()', () => {
      cy.get('[data-cy="cookie-login"]').click()
      login(username, { localhostCookieProps: `Expires=${(new Date()).toUTCString()}` })

      cy.getCookie('user').should('be.null')
    })

    it('expired -> not accessible via document.cookie', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      login(username, { cookieProps: `Expires=${(new Date()).toUTCString()}` })

      cy.location('host').should('equal', 'www.idp.com:3501')
      cy.wait(1000) // give cookie time to expire
      cy.reload()
      documentCookie().should('not.include', 'user=')
    })
  })

  describe('Max-Age', () => {
    let username

    beforeEach(() => {
      username = getUsername()

      cy.visit('/fixtures/primary-origin.html')
    })

    it('past max-age -> not logged in', () => {
      cy.get('[data-cy="cookie-login"]').click()
      login(username, { localhostCookieProps: 'Max-Age=1' })

      cy.wait(1500) // give cookie time to expire
      cy.reload()
      verifyLocalhostNotLoggedIn()
    })

    it('past max-age -> not accessible via cy.getCookie()', () => {
      cy.get('[data-cy="cookie-login"]').click()
      login(username, { localhostCookieProps: 'Max-Age=1' })

      cy.wait(1500) // give cookie time to expire
      cy.reload()
      cy.getCookie('user').should('be.null')
    })

    it('past max-age -> not accessible via document.cookie', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      login(username, { cookieProps: 'Max-Age=1' })

      cy.location('host').should('equal', 'www.idp.com:3501')
      cy.wait(1500) // give cookie time to expire
      cy.reload()
      documentCookie().should('not.include', 'user=')
    })

    describe('preference over Expires', () => {
      beforeEach(() => {
        cy.get('[data-cy="cookie-login"]').click()
      })

      it('past Max-Age, before Expires -> not logged in', () => {
        const expires = dayjs().add(1, 'day').toDate().toUTCString()

        login(username, { localhostCookieProps: `Max-Age=1; Expires=${expires}` })

        cy.wait(1500) // give cookie time to expire
        cy.reload()
        verifyLocalhostNotLoggedIn()
      })

      it('before Max-Age, past Expires -> logged in', () => {
        login(username, { localhostCookieProps: `Max-Age=10000000; Expires=${(new Date()).toUTCString()}` })

        cy.wait(1500) // ensure cookie doesn't expire in this time
        cy.reload()
        verifyLoggedIn(username)
      })
    })
  })

  describe('--Host- prefix', () => {
    let username

    beforeEach(() => {
      username = getUsername()

      cy.visit('https://localhost:3502/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login-https"]').click()
    })

    it('__Host- + Secure + Path=/ -> logged in', () => {
      login(username, { cookieKey: '__Host-user', cookieProps: 'Secure; Path=/' })

      verifyLoggedIn(username, { cookieKey: '__Host-user' })
    })

    it('__Host-, no Secure -> not logged in', () => {
      login(username, { cookieKey: '__Host-user', cookieProps: 'Path=/' })

      // __Host- prefix must have Secure flag
      verifyIdpNotLoggedIn({ isHttps: true, cookieKey: '__Host-user' })
    })

    it('__Host-, no Path -> logged in', () => {
      login(username, { cookieKey: '__Host-user', cookieProps: 'Secure' })

      verifyLoggedIn(username, { cookieKey: '__Host-user' })
    })

    it('__Host-, disallowed Path -> not logged in', () => {
      login(username, { cookieKey: '__Host-user', cookieProps: 'Secure; Path=/nope' })

      // __Host- prefix must have Path=/
      verifyIdpNotLoggedIn({ isHttps: true, cookieKey: '__Host-user' })
    })

    it('__Host- + Domain -> not logged in', () => {
      login(username, { cookieKey: '__Host-user', cookieProps: 'Secure; Path=/; Domain=foobar.com' })

      // __Host- prefix can't have Domain specified
      verifyIdpNotLoggedIn({ isHttps: true, cookieKey: '__Host-user' })
    })
  })

  describe('__Secure- prefix', () => {
    let username

    beforeEach(() => {
      username = getUsername()

      cy.visit('https://localhost:3502/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login-https"]').click()
    })

    it('__Secure- + Secure flag -> logged in', () => {
      login(username, { cookieKey: '__Secure-user', cookieProps: 'Secure' })

      verifyLoggedIn(username, { cookieKey: '__Secure-user' })
    })

    it('__Secure, no Secure flag -> not logged in', () => {
      login(username, { cookieKey: '__Secure-user' })

      // __Secure- prefix requires Secure flag
      verifyIdpNotLoggedIn({ isHttps: true, cookieKey: '__Secure-user' })
    })
  })

  describe('document.cookie', () => {
    let username

    beforeEach(() => {
      username = getUsername()

      cy.visit('/fixtures/primary-origin.html')
    })

    it('gets cookie set by http request', () => {
      cy.get('[data-cy="cookie-login-land-on-document-cookie"]').click()
      login(username)

      cy.location('host').should('equal', 'www.idp.com:3501')
      cy.get('[data-cy="doc-cookie"]').invoke('text')
      .should('include', `user=${username}`)
    })

    it('works when setting cookie', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      setDocumentCookie('key=value')

      documentCookie().should('equal', 'key=value')
    })

    it('does not error when setting cookie with different domain', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      setDocumentCookie('key=value; domain=www.example.com')

      // the cookie should not be set if the domain does not match
      documentCookie().should('equal', '')
    })

    it('works when setting cookie with extra, benign parts', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      setDocumentCookie('key=value; wont=beset')

      documentCookie().should('equal', 'key=value')
    })

    it('cookie properties are preserved when set via automation', () => {
      cy.get('[data-cy="cookie-https"]').click()
      setDocumentCookie('key=value; SameSite=Strict; Secure; Path=/fixtures')

      cy.getCookie('key').should((cookie) => {
        expect(Cypress._.omit(cookie, 'expiry')).to.deep.equal({
          domain: 'www.foobar.com',
          httpOnly: false,
          hostOnly: true,
          name: 'key',
          path: '/fixtures',
          sameSite: 'strict',
          secure: true,
          value: 'value',
        })
      })

      documentCookie().should('equal', 'key=value')
    })

    it('does not set cookie when invalid', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      setDocumentCookie('=value')

      documentCookie().should('equal', '')
    })

    it('works when setting subsequent cookies', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      setDocumentCookie('key1=value1')

      documentCookie().should('equal', 'key1=value1')
      setDocumentCookie('key2=value2')

      documentCookie().should('equal', 'key1=value1; key2=value2')
    })

    it('makes cookie available to cy.getCookie()', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      setDocumentCookie('key=value')

      cy.getCookie('key').its('value').should('equal', 'value')
    })

    it('returns cookie set by cy.setCookie()', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      login(username)

      cy.location('host').should('equal', 'www.idp.com:3501')
      cy.setCookie('foo', 'bar')
      documentCookie().should('include', 'foo=bar')
    })

    it('no longer returns cookie after cy.clearCookie()', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      login(username)

      cy.location('host').should('equal', 'www.idp.com:3501')
      cy.clearCookie('user')
      documentCookie().should('equal', '')
    })

    it('no longer returns cookies after cy.clearCookies()', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      login(username)

      cy.location('host').should('equal', 'www.idp.com:3501')
      cy.clearCookies()
      documentCookie().should('equal', '')
    })

    it('works when setting cookie in addition to cookie that already exists from http request', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      login(username)

      cy.location('host').should('equal', 'www.idp.com:3501')
      setDocumentCookie('key=value')

      // order of the cookies differs depending on browser, so just
      // ensure that each one is there
      documentCookie().should('include', 'key=value')
      documentCookie().should('include', `user=${username}`)
    })

    it('reads a cookie the page sets with document.cookie while loading', () => {
      cy.get('[data-cy="document-cookie"]').click()
      documentCookie().should('include', 'name=value')
      cy.get('[data-cy="doc-cookie"]').invoke('text').should('equal', 'name=value')
      cy.getCookie('name').should((cookie) => {
        expect(Cypress._.omit(cookie, 'expiry')).to.deep.equal({
          domain: 'www.foobar.com',
          httpOnly: false,
          hostOnly: true,
          name: 'name',
          path: '/',
          sameSite: 'lax',
          secure: false,
          value: 'value',
        })
      })
    })

    it('preserves duplicate cookie keys', () => {
      cy.get('[data-cy="cookie-login-land-on-document-cookie"]').click()
      login(username)

      // ensure we've redirected to the right page
      cy.url().should('include', 'http://www.idp.com:3501/fixtures/auth/document-cookie.html')
      setDocumentCookie('key=value1; domain=www.idp.com')
      setDocumentCookie('key=value2; domain=idp.com')

      // order of the cookies differs depending on browser, so just
      // ensure that each one is there
      documentCookie().should('include', 'key=value1')
      documentCookie().should('include', 'key=value2')
    })

    it('setting cookie preserves cookies on subsequent page loads', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      setDocumentCookie('key=value')

      documentCookie().should('equal', 'key=value')
      cy.wait(500)
      cy.reload()
      documentCookie().should('equal', 'key=value')
    })
  })
})
