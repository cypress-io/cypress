/* eslint-disable mocha/no-top-level-tests, no-undef */
it('throws if mutating read-only config with test configuration', { chromeWebSecurity: false }, () => {
  expect(true)
})
