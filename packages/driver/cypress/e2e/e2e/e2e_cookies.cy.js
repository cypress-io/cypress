const { _ } = Cypress

const cleanse = (cookies) => {
  return _.cloneDeepWith(cookies, (v, key) => {
    if (key === 'expiry') {
      return 100
    }
  })
}

const firefoxDefaultSameSite = Cypress.isBrowser({ family: 'firefox' }) ? { sameSite: 'no_restriction' } : {}

describe('e2e cookies spec', () => {
  it('simple cookie', () => {
    cy.setCookie('foo', 'bar')
    cy.getCookie('foo', 'bar')
    .then((cookie) => expect(cookie).exist)
  })

  context('__Host- prefix', () => {
    // https://github.com/cypress-io/cypress/issues/8261
    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23444
    it('can set __Host- cookie', { retries: 15 }, () => {
      cy.visit('https://example.com')
      cy.setCookie('__Host-foobar', 'someval', {
        domain: 'example.com',
        sameSite: 'strict',
        secure: true,
      })

      cy.getCookie('__Host-foobar').then(((cookie) => {
        expect(cookie).exist
        expect(cookie.domain).match(/^\.?example\.com$/)
        expect(cookie.path).eq('/')
        expect(cookie.secure).is.true
      }))
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23444
    it('errors when __Host- cookie and secure:false', { retries: 15 }, (done) => {
      cy.visit('https://example.com')
      cy.setCookie('__Host-foobar', 'someval')

      cy.on('fail', (err) => {
        expect(err.message)
        .contain('__Host-')
        .contain('must be set with `{ secure: true }`')

        done()
      })
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23444
    it('errors when __Host- cookie and path', { retries: 15 }, (done) => {
      cy.visit('https://example.com')
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
    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23444
    it('can set __Secure- cookie', { retries: 15 }, () => {
      cy.visit('https://example.com')
      cy.setCookie('__Secure-foobar', 'someval', {
        domain: 'example.com',
        path: '/foo',
        secure: true,
      })

      cy.getCookie('__Secure-foobar').then(((cookie) => {
        expect(cookie).exist
        expect(cookie.domain).match(/^\.?example\.com$/)
        expect(cookie.path).eq('/foo')
        expect(cookie.secure).is.true
      }))
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23444
    it('errors when __Secure- cookie secure:false', { retries: 15 }, (done) => {
      cy.visit('https://example.com')
      cy.setCookie('__Secure-foobar', 'someval', {
        domain: 'example.com',
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
