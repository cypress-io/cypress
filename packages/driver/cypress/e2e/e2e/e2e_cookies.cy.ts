const cleanse = (cookies: Cypress.Cookie[]) => {
  return Cypress._.cloneDeepWith(cookies, (v, key) => {
    return key === 'expiry' ? 100 : undefined
  })
}

const firefoxDefaultSameSite = Cypress.isBrowser({ family: 'firefox' }) ? { sameSite: 'unspecified' } : {}

describe('e2e cookies spec', () => {
  it('simple cookie', () => {
    cy.setCookie('foo', 'bar')
    cy.getCookie('foo').should('exist')
  })

  context('document.cookie writes in the primary origin', () => {
    const sessionToken = 'eyJhbGciOiJIUzI1NiJ9.c2Vzc2lvbi1tYXJpYS1nYXJjaWE'

    beforeEach(() => {
      cy.visit('/dump-headers')
      cy.window().then((win) => win.fetch(`/set-cookie?cookie=${encodeURIComponent(`session_token=${sessionToken}; Path=/`)}`))
      cy.reload()
      cy.contains(`session_token=${sessionToken}`)
    })

    it('does not send a cookie the page deleted on the next navigation', () => {
      cy.window().then((win) => {
        win.document.cookie = 'session_token=; Max-Age=0; Path=/'
        win.location.reload()
      })

      cy.contains('request headers').should('not.contain', 'session_token')
    })

    it('sends the value the page last wrote on the next navigation', () => {
      cy.window().then((win) => {
        win.document.cookie = 'session_token=rotated-9f2c41d7; Path=/'
        win.location.reload()
      })

      cy.contains('session_token=rotated-9f2c41d7')
      cy.contains('request headers').should('not.contain', sessionToken)
    })

    context('after a redirect through another origin', () => {
      const redirectThroughAnotherOrigin = (win: Window) => {
        const hop = `http://www.foobar.com:3500/redirect?code=302&href=${encodeURIComponent('http://localhost:3500/dump-headers?redirected=true')}`

        win.location.href = `/redirect?code=302&href=${encodeURIComponent(hop)}`
      }

      ;['Lax', 'Strict'].forEach((sameSite) => {
        it(`sends a SameSite=${sameSite} cookie`, () => {
          cy.window().then((win) => win.fetch(`/set-cookie?cookie=${encodeURIComponent(`csrf_state=b7e1f03a; Path=/; SameSite=${sameSite}`)}`))
          cy.window().then(redirectThroughAnotherOrigin)

          cy.location('search').should('eq', '?redirected=true')
          cy.contains('csrf_state=b7e1f03a')
        })
      })

      // Firefox withholds SameSite cookies from this navigation, so the server-side jar,
      // which never saw the deletion, still supplies them
      it('does not send a cookie the page deleted before the redirect', { browser: { family: 'chromium' } }, () => {
        cy.window().then((win) => {
          win.document.cookie = 'session_token=; Max-Age=0; Path=/'
          redirectThroughAnotherOrigin(win)
        })

        cy.location('search').should('eq', '?redirected=true')
        cy.contains('request headers').should('not.contain', 'session_token')
      })

      it('does not send a cookie the page deleted on a later navigation', () => {
        cy.window().then(redirectThroughAnotherOrigin)
        cy.location('search').should('eq', '?redirected=true')

        cy.window().then((win) => {
          win.document.cookie = 'session_token=; Max-Age=0; Path=/'
          win.location.reload()
        })

        cy.contains('request headers').should('not.contain', 'session_token')
      })
    })
  })

  context('__Host- prefix', () => {
    // https://github.com/cypress-io/cypress/issues/8261
    it('can set __Host- cookie', () => {
      cy.visit('https://foobar.com:3502/fixtures/primary-origin.html')
      cy.setCookie('__Host-foobar', 'someval', {
        domain: 'foobar.com',
        sameSite: 'strict',
        secure: true,
      })

      cy.getCookie('__Host-foobar').should((cookie) => {
        expect(cookie).exist
        expect(cookie!.domain).match(/^\.?foobar\.com$/)
        expect(cookie!.path).eq('/')
        expect(cookie!.secure).is.true
      })
    })

    it('errors when __Host- cookie and secure:false', (done) => {
      cy.visit('https://foobar.com:3502/fixtures/primary-origin.html')
      cy.setCookie('__Host-foobar', 'someval')

      cy.on('fail', (err) => {
        expect(err.message)
        .contain('__Host-')
        .contain('must be set with `{ secure: true }`')

        done()
      })
    })

    it('errors when __Host- cookie and path', (done) => {
      cy.visit('https://foobar.com:3502/fixtures/primary-origin.html')
      cy.setCookie('__Host-foobar', 'someval', {
        secure: true,
        path: '/foo',
      })

      cy.on('fail', (err) => {
        expect(err.message).contain('__Host-').contain('the path must be')
        done()
      })
    })
  })

  context('__Secure- prefix', () => {
    it('can set __Secure- cookie', () => {
      cy.visit('https://foobar.com:3502/fixtures/primary-origin.html')
      cy.setCookie('__Secure-foobar', 'someval', {
        domain: 'foobar.com',
        path: '/foo',
        secure: true,
      })

      cy.getCookie('__Secure-foobar').should((cookie) => {
        expect(cookie).exist
        expect(cookie!.domain).match(/^\.?foobar\.com$/)
        expect(cookie!.path).eq('/foo')
        expect(cookie!.secure).is.true
      })
    })

    it('errors when __Secure- cookie secure:false', (done) => {
      cy.visit('https://foobar.com:3502/fixtures/primary-origin.html')
      cy.setCookie('__Secure-foobar', 'someval', {
        domain: 'foobar.com',
        path: '/foo',
      })

      cy.on('fail', (err) => {
        expect(err.message)
        .contain('__Secure-')
        .contain('must be set with `{ secure: true }`')

        done()
      })
    })

    // a hostOnly cookie is set in the browser by omitting the 'domain' property
    // so for cross-domain cookies users need to add hostOnly: true as well as 'domain'
    // TODO: un-skip when we rework cookie API to support setting hostOnly thirdparty cookies.
    // https://github.com/cypress-io/cypress/issues/17527
    it.skip('can set hostOnly cookies', () => {
      cy.setCookie('one', 'bar', { hostOnly: true, domain: 'example.com' })
      cy.setCookie('one', 'bar', { hostOnly: true })

      cy.getCookies({ domain: 'example.com' })
      .then(cleanse)
      .should('deep.eq', [{
        name: 'one',
        value: 'bar',
        path: '/',
        domain: 'example.com',
        secure: false,
        httpOnly: false,
        hostOnly: true,
        expiry: 100,
        ...firefoxDefaultSameSite,
      }])
    })
  })
})
