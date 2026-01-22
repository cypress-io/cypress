describe('cy.env()', () => {
  it('should return the value of a single environment variable', () => {
    cy.env(['CY_ENV_FOO']).then(({ CY_ENV_FOO }) => {
      expect(CY_ENV_FOO).to.equal('foo')
    })

    cy.env(['CY_ENV_FOO']).should('deep.include', {
      CY_ENV_FOO: 'foo',
    })
  })

  it('should return the value of multiple environment variables', () => {
    cy.env(['CY_ENV_FOO', 'CY_ENV_BAR', 'CY_ENV_BAZ']).then(({ CY_ENV_FOO, CY_ENV_BAR, CY_ENV_BAZ }) => {
      expect(CY_ENV_FOO).to.equal('foo')
      expect(CY_ENV_BAR).to.equal('bar')
      expect(CY_ENV_BAZ).to.equal('baz')
    })

    cy.env(['CY_ENV_FOO', 'CY_ENV_BAR', 'CY_ENV_BAZ']).should('deep.include', {
      CY_ENV_FOO: 'foo',
      CY_ENV_BAR: 'bar',
      CY_ENV_BAZ: 'baz',
    })
  })

  it('should return undefined if passed a key that doesn\'t have a value', () => {
    cy.env(['CY_ENV_DOES_NOT_EXIST']).then(({ CY_ENV_DOES_NOT_EXIST }) => {
      expect(CY_ENV_DOES_NOT_EXIST).to.be.undefined
    })
  })

  it('should fail if not called with any arguments', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('`cy.env()` must be passed a non-empty list of strings. You passed: \'undefined\'.')
      done()
    })

    // @ts-expect-error should fail
    cy.env()
  })

  it('should fail if passed an empty string', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('`cy.env()` must be passed a non-empty list of strings. You passed: \'\'.')
      done()
    })

    // should fail
    cy.env([''])
  })

  it('should fail if passed invalid data type', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('`cy.env()` must be passed a non-empty list of strings. You passed: \'123\'.')
      done()
    })

    // @ts-expect-error - we want to test the error message
    // should fail
    cy.env(123)
  })

  it('works within cy.origin()', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('[data-cy="cookie-login-alias"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
      cy.env(['CY_ENV_FOO']).then(({ CY_ENV_FOO }) => {
        expect(CY_ENV_FOO).to.equal('foo')
      })
    })
  })
})
