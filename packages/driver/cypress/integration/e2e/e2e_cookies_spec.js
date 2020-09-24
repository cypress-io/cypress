describe('e2e cookies spec', () => {
  it('simple cookie', () => {
    cy.setCookie('foo', 'bar')
    cy.getCookie('foo', 'bar')
    .then((cookie) => expect(cookie).exist)
  })

  context('__Host- prefix', () => {
    // https://github.com/cypress-io/cypress/issues/8261
    it('can set __Host- cookie', () => {
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

    it('errors when __Host- cookie and secure:false', (done) => {
      cy.visit('https://example.com')
      cy.setCookie('__Host-foobar', 'someval')

      cy.on('fail', (err) => {
        expect(err.message)
        .contain('__Host-')
        .contain('must be set with `{ secure: true }`')

        done()
      })
    })

    it('errors when __Host- cookie and path', (done) => {
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
    it('can set __Secure- cookie', () => {
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

    it('errors when __Secure- cookie secure:false', (done) => {
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
  })
})
