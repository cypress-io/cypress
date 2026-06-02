describe('suite and test expose overrides merge with test-level keys taking precedence', { expose: { shared: 'suite', suiteOnly: 'suite' } }, () => {
  it('merges suite-level and test-level expose overrides', { expose: { shared: 'test', testOnly: 'test' } }, () => {
    expect(Cypress.expose('shared')).to.eq('test')
    expect(Cypress.expose('suiteOnly')).to.eq('suite')
    expect(Cypress.expose('testOnly')).to.eq('test')
  })

  it('does not leak test-level expose overrides to subsequent tests', () => {
    expect(Cypress.expose('shared')).to.eq('suite')
    expect(Cypress.expose('suiteOnly')).to.eq('suite')
    expect(Cypress.expose('testOnly')).to.eq(undefined)
  })
})
