describe('in-test mutations to override values are restored before the next test', () => {
  it('applies the test config override value', { expose: { foo: 'from-override' } }, () => {
    expect(Cypress.expose('foo')).to.eq('from-override')
    Cypress.expose('foo', 'mutated-in-test')
    expect(Cypress.expose('foo')).to.eq('mutated-in-test')
  })

  it('restores the key to its pre-override value when the next test has no override', () => {
    expect(Cypress.expose('foo')).to.eq(undefined)
  })
})
