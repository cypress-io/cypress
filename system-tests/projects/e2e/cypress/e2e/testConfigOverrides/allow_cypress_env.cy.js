describe('testConfigOverrides with allowCypressEnv=false', () => {
  it('fails when trying to perform testConfigOverrides for Cypress.env()', { env: { CY_ENV_FOO: 'foofoofoo', CY_ENV_BAR: 'barbarbar', CY_ENV_BAZ: 'bazbazbaz' } }, () => {
    expect(Cypress.env('CY_ENV_FOO')).to.eq('foofoofoo')
    expect(Cypress.env('CY_ENV_BAR')).to.eq('barbarbar')
    expect(Cypress.env('CY_ENV_BAZ')).to.eq('bazbazbaz')
  })
})
