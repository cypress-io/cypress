describe('e2e cookies spec', () => {
  it('simple cookie', () => {
    cy.setCookie('foo', 'bar')
    cy.getCookie('foo', 'bar')
    .then((cookie) => expect(cookie).exist)
  })

  // https://github.com/cypress-io/cypress/issues/8261
  it('can set __Host- cookie', () => {
    cy.visit('https://example.com')
    cy.setCookie('__Host-foobar', 'someval', {
      domain: 'example.com',
      sameSite: 'strict',
      httpOnly: true,
      path: '/',
      secure: true,
    })

    cy.getCookie('__Host-foobar').then(((cookie) => {
      expect(cookie).exist
      expect(cookie.domain).match(/^\.?example\.com$/)
    }))
  })

  it('errors when __Host- cookie and secure:false', (done) => {
    cy.visit('https://example.com')
    cy.setCookie('__Host-foobar', 'someval', {
      domain: 'example.com',
      sameSite: 'strict',
      path: '/',
      secure: false,
    })

    cy.on('fail', (err) => {
      expect(err.message).contain('must have `{ secure: true }`')
      done()
    })
  })
})
