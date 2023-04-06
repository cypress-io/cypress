import dayjs from 'dayjs'

describe('cy.origin - cookie login', { browser: '!webkit' }, () => {
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
    const [protocol, port] = isHttps ? ['https', '3502'] : ['http', '3501']

    cy.origin(`${protocol}://${subdomain}.idp.com:${port}`, { args: { cookieKey, expectNullCookie } }, ({ cookieKey, expectNullCookie }) => {
      cy.get('h1')
      .invoke('text')
      .should('equal', 'Not logged in')

      if (expectNullCookie) {
        cy.getCookie(cookieKey).should('be.null')
      }
    })
  }

  const verifyLocalhostNotLoggedIn = () => {
    cy.get('h1').invoke('text').should('equal', 'No user found')
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

  describe('general behavior', { browser: '!webkit' }, () => {
    let username

    beforeEach(() => {
      username = getUsername()
    })

    it('works in a session', () => {
      cy.session(username, () => {
        cy.visit('/fixtures/primary-origin.html')
        cy.get('[data-cy="cookie-login"]').click()
        cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
          cy.get('[data-cy="username"]').type(username)
          cy.get('[data-cy="login"]').click()
        })

        cy.getCookie('user').its('value').should('equal', username)
      }, {
        validate () {
          cy.getCookie('user').its('value').should('equal', username)
        },
      })

      cy.visit('/welcome')
      verifyLoggedIn(username)
    })

    // need to fix the following issues for this to work in Firefox:
    // https://github.com/cypress-io/cypress/issues/363
    // https://github.com/cypress-io/cypress/issues/17527
    it('works with aliased localhost', { browser: '!firefox' }, () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login-alias"]').click()

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('handles browser-sent cookies being overridden by server-kept cookies', () => {
      cy.visit('https://localhost:3502/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login-override"]').click()
      cy.origin('https://www.foobar.com:3502', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('cy.clearCookie() -> not logged in', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      cy.clearCookie('user')
      cy.reload()
      verifyLocalhostNotLoggedIn()
    })

    it('cy.clearCookies() -> not logged in', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

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
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('SameSite=Lax -> logged in', () => {
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('SameSite=Lax')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('SameSite=Strict -> not logged in', () => {
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('SameSite=Strict')
        cy.get('[data-cy="login"]').click()
      })

      // SameSite=Strict does not allow any cross-origin requests. cookie still
      // gets set but not applied to request
      verifyIdpNotLoggedIn({ expectNullCookie: false })
    })

    // FIXME: Currently in Firefox, the default cookie setting in the extension is no_restriction, which can be set with Secure=false.
    it('SameSite=None -> not logged in', { browser: '!firefox' }, () => {
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('SameSite=None')
        cy.get('[data-cy="login"]').click()
      })

      // SameSite=None requires Secure flag
      verifyIdpNotLoggedIn()
    })

    it('invalid SameSite (defaults to Lax) -> logged in', () => {
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('SameSite=Invalid')
        cy.get('[data-cy="login"]').click()
      })

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

      cy.origin('https://www.foobar.com:3502', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('Secure')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('Secure + http -> not logged in', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login"]').click()

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('Secure')
        cy.get('[data-cy="login"]').click()
      })

      // Secure flag requires https. cookie still gets set but not applied to
      // request
      verifyIdpNotLoggedIn({ expectNullCookie: false })
    })

    it('no Secure + https -> logged in', () => {
      cy.visit('https://localhost:3502/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login-https"]').click()

      cy.origin('https://www.foobar.com:3502', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('no Secure + http -> logged in', () => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('[data-cy="cookie-login"]').click()

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

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

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('no Domain + subdomain -> logged in', () => {
      cy.get('[data-cy="cookie-login-subdomain"]').click()

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('Domain + superdomain -> logged in', () => {
      cy.get('[data-cy="cookie-login"]').click()

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('Domain=idp.com')
        cy.get('[data-cy="localhostCookieProps"]').type('Domain=localhost')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('Domain + subdomain -> logged in', () => {
      cy.get('[data-cy="cookie-login-subdomain"]').click()

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('Domain=idp.com')
        cy.get('[data-cy="localhostCookieProps"]').type('Domain=localhost')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('subdomain Domain + superdomain -> not logged in', () => {
      cy.get('[data-cy="cookie-login"]').click()

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('Domain=baz.idp.com')
        cy.get('[data-cy="localhostCookieProps"]').type('Domain=localhost')
        cy.get('[data-cy="login"]').click()
      })

      // Domain=subdomain requires request to be on that subdomain
      verifyIdpNotLoggedIn()
    })

    it('subdomain Domain + subdomain -> logged in', () => {
      cy.get('[data-cy="cookie-login-subdomain"]').click()

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('Domain=baz.idp.com')
        cy.get('[data-cy="localhostCookieProps"]').type('Domain=localhost')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('subdomain Domain + different subdomain -> not logged in', () => {
      cy.get('[data-cy="cookie-login-subdomain"]').click()

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('Domain=qux.foobar.com')
        cy.get('[data-cy="login"]').click()
      })

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

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('Path=/verify-cookie-login')
        cy.get('[data-cy="localhostCookieProps"]').type('Path=/welcome')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username)
    })

    it('path does not match -> not logged in', () => {
      cy.get('[data-cy="cookie-login"]').click()

      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('Path=/nope')
        cy.get('[data-cy="login"]').click()
      })

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
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        const expires = (new Date()).toUTCString()

        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="localhostCookieProps"]').type(`Expires=${expires}`)
        cy.get('[data-cy="login"]').click()
      })

      verifyLocalhostNotLoggedIn()
    })

    it('expired -> not accessible via cy.getCookie()', () => {
      cy.get('[data-cy="cookie-login"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        const expires = (new Date()).toUTCString()

        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="localhostCookieProps"]').type(`Expires=${expires}`)
        cy.get('[data-cy="login"]').click()
      })

      cy.getCookie('user').should('be.null')
    })

    it('expired -> not accessible via document.cookie', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        const expires = (new Date()).toUTCString()

        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type(`Expires=${expires}`)
        cy.get('[data-cy="login"]').click()
      })

      cy.origin('http://www.idp.com:3501', () => {
        cy.wait(1000) // give cookie time to expire
        cy.reload()
        cy.document().its('cookie').should('not.include', 'user=')
      })
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
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="localhostCookieProps"]').type('Max-Age=1')
        cy.get('[data-cy="login"]').click()
      })

      cy.wait(1500) // give cookie time to expire
      cy.reload()
      verifyLocalhostNotLoggedIn()
    })

    // expiring cookies set by automation don't seem to get unset appropriately
    // in Firefox. this issue doesn't seem to be specific to cross-origin tests,
    // as it happens even using cy.setCookie()
    it('past max-age -> not accessible via cy.getCookie()', { browser: '!firefox' }, () => {
      cy.get('[data-cy="cookie-login"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="localhostCookieProps"]').type('Max-Age=1')
        cy.get('[data-cy="login"]').click()
      })

      cy.wait(1500) // give cookie time to expire
      cy.reload()
      cy.getCookie('user').should('be.null')
    })

    // expiring cookies set by automation don't seem to get unset appropriately
    // in Firefox. this issue doesn't seem to be specific to cross-origin tests,
    // as it happens even using cy.setCookie()
    it('past max-age -> not accessible via document.cookie', { browser: '!firefox' }, () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieProps"]').type('Max-Age=1')
        cy.get('[data-cy="login"]').click()
      })

      cy.origin('http://www.idp.com:3501', () => {
        cy.wait(1500) // give cookie time to expire
        cy.reload()
        cy.document().its('cookie').should('not.include', 'user=')
      })
    })

    describe('preference over Expires', () => {
      beforeEach(() => {
        cy.get('[data-cy="cookie-login"]').click()
      })

      it('past Max-Age, before Expires -> not logged in', () => {
        const expires = dayjs().add(1, 'day').toDate().toUTCString()

        cy.origin('http://www.foobar.com:3500', { args: { username, expires } }, ({ username, expires }) => {
          cy.get('[data-cy="username"]').type(username)
          cy.get('[data-cy="localhostCookieProps"]').type(`Max-Age=1; Expires=${expires}`)
          cy.get('[data-cy="login"]').click()
        })

        cy.wait(1500) // give cookie time to expire
        cy.reload()
        verifyLocalhostNotLoggedIn()
      })

      it('before Max-Age, past Expires -> logged in', () => {
        cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
          const expires = (new Date()).toUTCString()

          cy.get('[data-cy="username"]').type(username)
          cy.get('[data-cy="localhostCookieProps"]').type(`Max-Age=10000000; Expires=${expires}`)
          cy.get('[data-cy="login"]').click()
        })

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
      cy.origin('https://www.foobar.com:3502', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieKey"]').clear().type('__Host-user')
        cy.get('[data-cy="cookieProps"]').type('Secure; Path=/')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username, { cookieKey: '__Host-user' })
    })

    it('__Host-, no Secure -> not logged in', () => {
      cy.origin('https://www.foobar.com:3502', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieKey"]').clear().type('__Host-user')
        cy.get('[data-cy="cookieProps"]').type('Path=/')
        cy.get('[data-cy="login"]').click()
      })

      // __Host- prefix must have Secure flag
      verifyIdpNotLoggedIn({ isHttps: true, cookieKey: '__Host-user' })
    })

    it('__Host-, no Path -> logged in', () => {
      cy.origin('https://www.foobar.com:3502', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieKey"]').clear().type('__Host-user')
        cy.get('[data-cy="cookieProps"]').type('Secure')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username, { cookieKey: '__Host-user' })
    })

    it('__Host-, disallowed Path -> not logged in', () => {
      cy.origin('https://www.foobar.com:3502', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieKey"]').clear().type('__Host-user')
        cy.get('[data-cy="cookieProps"]').type('Secure; Path=/nope')
        cy.get('[data-cy="login"]').click()
      })

      // __Host- prefix must have Path=/
      verifyIdpNotLoggedIn({ isHttps: true, cookieKey: '__Host-user' })
    })

    it('__Host- + Domain -> not logged in', () => {
      cy.origin('https://www.foobar.com:3502', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieKey"]').clear().type('__Host-user')
        cy.get('[data-cy="cookieProps"]').type('Secure; Path=/; Domain=foobar.com')
        cy.get('[data-cy="login"]').click()
      })

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
      cy.origin('https://www.foobar.com:3502', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieKey"]').clear().type('__Secure-user')
        cy.get('[data-cy="cookieProps"]').type('Secure')
        cy.get('[data-cy="login"]').click()
      })

      verifyLoggedIn(username, { cookieKey: '__Secure-user' })
    })

    it('__Secure, no Secure flag -> not logged in', () => {
      cy.origin('https://www.foobar.com:3502', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="cookieKey"]').clear().type('__Secure-user')
        cy.get('[data-cy="login"]').click()
      })

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
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      cy.origin('http://www.idp.com:3501', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="doc-cookie"]').invoke('text')
        .should('include', `user=${username}`)
      })
    })

    it('works when setting cookie', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      cy.origin('http://www.foobar.com:3500', () => {
        cy.document().then((doc) => {
          doc.cookie = 'key=value'
        })

        cy.document().its('cookie').should('equal', 'key=value')
      })
    })

    it('does not error when setting cookie with different domain', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      cy.origin('http://www.foobar.com:3500', () => {
        cy.document().then((doc) => {
          doc.cookie = 'key=value; domain=www.example.com'
        })

        // the cookie should not be set if the domain does not match
        cy.document().its('cookie').should('equal', '')
      })
    })

    it('works when setting cookie with extra, benign parts', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      cy.origin('http://www.foobar.com:3500', () => {
        cy.document().then((doc) => {
          doc.cookie = 'key=value; wont=beset'
        })

        cy.document().its('cookie').should('equal', 'key=value')
      })
    })

    it('cookie properties are preserved when set via automation', () => {
      cy.get('[data-cy="cookie-https"]').click()
      cy.origin('https://www.foobar.com:3502', () => {
        cy.document().then((doc) => {
          doc.cookie = 'key=value; SameSite=Strict; Secure; Path=/fixtures'
        })

        cy.getCookie('key').then((cookie) => {
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

        cy.document().its('cookie').should('equal', 'key=value')
      })
    })

    it('does not set cookie when invalid', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      cy.origin('http://www.foobar.com:3500', () => {
        cy.document().then((doc) => {
          doc.cookie = '=value'
        })

        cy.document().its('cookie').should('equal', '')
      })
    })

    it('works when setting subsequent cookies', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      cy.origin('http://www.foobar.com:3500', () => {
        cy.document().then((doc) => {
          doc.cookie = 'key1=value1'
        })

        cy.document().its('cookie').should('equal', 'key1=value1')
        cy.document().then((doc) => {
          doc.cookie = 'key2=value2'
        })

        cy.document().its('cookie').should('equal', 'key1=value1; key2=value2')
      })
    })

    it('makes cookie available to cy.getCookie()', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      cy.origin('http://www.foobar.com:3500', () => {
        cy.document().then((doc) => {
          doc.cookie = 'key=value'
        })

        // it can take a small amount of time for the cookie to make it to
        // automation, but it's unlikely a user will encounter this issue
        // since they'd pretty much have to write this exact test. making it
        // wait a second is probably overkill, but purposefully keeping the
        // wait long to avoid this test becoming flaky
        cy.wait(1000)
        cy.getCookie('key').its('value').should('equal', 'value')
      })
    })

    it('returns cookie set by cy.setCookie()', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      cy.origin('http://www.idp.com:3501', () => {
        cy.setCookie('foo', 'bar')
        cy.document().its('cookie').should('include', 'foo=bar')
      })
    })

    it('no longer returns cookie after cy.clearCookie()', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      cy.origin('http://www.idp.com:3501', () => {
        cy.clearCookie('user')
        cy.document().its('cookie').should('equal', '')
      })
    })

    it('no longer returns cookies after cy.clearCookies()', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      cy.origin('http://www.idp.com:3501', () => {
        cy.clearCookies()
        cy.document().its('cookie').should('equal', '')
      })
    })

    it('works when setting cookie in addition to cookie that already exists from http request', () => {
      cy.get('[data-cy="cookie-login-land-on-idp"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      cy.origin('http://www.idp.com:3501', { args: { username } }, ({ username }) => {
        cy.document().then((doc) => {
          doc.cookie = 'key=value'
        })

        // order of the cookies differs depending on browser, so just
        // ensure that each one is there
        cy.document().its('cookie').should('include', 'key=value')
        cy.document().its('cookie').should('include', `user=${username}`)
      })
    })

    it('sets and reads document.cookie prior to attaching', () => {
      cy.origin('http://www.foobar.com:3500', () => {}).then(() => {
        // Force remove the spec bridge
        window?.top?.document.getElementById('Spec Bridge: http://www.foobar.com:3500')?.remove()
      })

      cy.get('[data-cy="document-cookie"]').click()
      cy.origin('http://www.foobar.com:3500', () => {
        cy.document().its('cookie').should('include', 'name=value')
        cy.get('[data-cy="doc-cookie"]').invoke('text').should('equal', 'name=value')
        cy.getCookie('name').then((cookie) => {
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
    })

    it('preserves duplicate cookie keys', () => {
      cy.get('[data-cy="cookie-login-land-on-document-cookie"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      cy.origin('http://www.idp.com:3501', () => {
        // ensure we've redirected to the right page
        cy.url().should('not.include', 'http://www.idp.com:3501/verify-cookie-login')
        cy.document().then((doc) => {
          doc.cookie = 'key=value1; domain=www.idp.com'
          doc.cookie = 'key=value2; domain=idp.com'
        })

        // order of the cookies differs depending on browser, so just
        // ensure that each one is there
        cy.document().its('cookie').should('include', 'key=value1')
        cy.document().its('cookie').should('include', 'key=value2')
      })
    })

    it('setting cookie preserves cookies on subsequent page loads', () => {
      cy.get('[data-cy="cross-origin-secondary-link"]').click()
      cy.origin('http://www.foobar.com:3500', () => {
        cy.document().then((doc) => {
          doc.cookie = 'key=value'
        })

        cy.document().its('cookie').should('equal', 'key=value')
        cy.wait(500)
        cy.reload()
        cy.document().its('cookie').should('equal', 'key=value')
      })
    })

    // the spec bridge will likely already exist in this spec when running
    // all the tests together, but this ensures the behavior in case it's run
    // alone or if we implement spec bridge removal in the future
    it('works when spec bridge is set up prior to page load', () => {
      cy.origin('http://www.idp.com:3501', () => {})

      cy.get('[data-cy="cookie-login-land-on-document-cookie"]').click()
      cy.origin('http://www.foobar.com:3500', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="username"]').type(username)
        cy.get('[data-cy="login"]').click()
      })

      cy.origin('http://www.idp.com:3501', { args: { username } }, ({ username }) => {
        cy.get('[data-cy="doc-cookie"]').invoke('text')
        .should('include', `user=${username}`)
      })
    })
  })
})
