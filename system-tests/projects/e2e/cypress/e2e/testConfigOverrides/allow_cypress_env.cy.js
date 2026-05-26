describe('testConfigOverrides env', () => {
  it('fails when trying to perform testConfigOverrides for env', { env: { CY_ENV_FOO: 'foofoofoo', CY_ENV_BAR: 'barbarbar', CY_ENV_BAZ: 'bazbazbaz' } }, () => {
    expect(true).ok
  })
})
