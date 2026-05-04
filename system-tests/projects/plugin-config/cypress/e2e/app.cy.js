it('overrides config', () => {
  // overrides come from plugins
  expect(Cypress.config('defaultCommandTimeout')).to.eq(500)
  expect(Cypress.config('videoCompression')).to.eq(20)

  // overrides come from CLI
  expect(Cypress.config('pageLoadTimeout')).to.eq(10000)
})

it('overrides env', () => {
  // overrides come from plugins
  cy.env(['foo']).then(({ foo }) => {
    expect(foo).to.eq('bar')
  })

  // overrides come from CLI
  cy.env(['bar']).then(({ bar }) => {
    expect(bar).to.eq('bar')
  })
})
