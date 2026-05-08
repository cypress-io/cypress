describe('allowCypressEnv', () => {
  it('invokes Cypress.env()', () => {
    expect(Cypress.env('CY_ENV_FOO'))
  })

  // testConfigOverrides are tested in /system-tests/test/testConfigOverrides_spec.ts
})
