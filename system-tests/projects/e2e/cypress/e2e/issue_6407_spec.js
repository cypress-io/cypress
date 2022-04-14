/* eslint-disable mocha/no-global-tests, no-undef */
it('throws if mutating read-only config with test configuration', { chromeWebSecurity: false }, () => {
  expect(true)
})
