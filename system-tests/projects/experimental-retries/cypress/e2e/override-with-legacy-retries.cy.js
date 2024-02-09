describe('overriding experimental retries with legacy retries', () => {
  const openMode = 1
  const runMode = 3

  it('sets the config', {
    retries: {
      openMode,
      runMode,
    },
  }, () => {
    const retries = Cypress.config('retries')

    expect(retries.runMode).to.eq(runMode)
    expect(retries.openMode).to.eq(openMode)
  })
})
