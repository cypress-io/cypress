it('overrides config', () => {
  // overrides come from plugins
  expect(Cypress.config('defaultCommandTimeout')).to.eq(500)
  expect(Cypress.config('videoCompression')).to.eq(20)

  // overrides come from CLI
  expect(Cypress.config('pageLoadTimeout')).to.eq(10000)

  // Gets correct configFile
  expect(Cypress.config('configFile')).to.eq('cypress.config.js')
})
