describe('Cypress.expose()', () => {
  it('invokes Cypress.expose()', () => {
    expect(Cypress.expose('CY_EXPOSE_FOO')).to.eq('foo')
    expect(Cypress.expose('CY_EXPOSE_BAR')).to.eq('bar')
    expect(Cypress.expose('CY_EXPOSE_ONE')).to.eq(1)
  })

  it('allows overriding values', () => {
    Cypress.expose('CY_EXPOSE_FOO', 'fooOverride')
    expect(Cypress.expose('CY_EXPOSE_FOO')).to.eq('fooOverride')
  })

  it('allows overriding values with an object', () => {
    Cypress.expose({
      CY_EXPOSE_BAR: 'barOverride',
    })

    expect(Cypress.expose('CY_EXPOSE_BAR')).to.eq('barOverride')
  })

  it('state overrides persist after the test', () => {
    expect(Cypress.expose('CY_EXPOSE_FOO')).to.eq('fooOverride')
    expect(Cypress.expose('CY_EXPOSE_BAR')).to.eq('barOverride')
  })
})
