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
