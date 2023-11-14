describe('overriding legacy retries with experimental retries', () => {
  const experimentalStrategy = 'detect-flake-and-pass-on-threshold'
  const openMode = false
  const runMode = true
  const maxRetries = 3
  const passesRequired = 1

  describe('at the describe level', {
    retries: {
      experimentalStrategy,
      openMode,
      runMode,
      experimentalOptions: {
        maxRetries,
        passesRequired,
      },
    },
  }, () => {
    it('sets the config', () => {
      const retries = Cypress.config('retries')

      expect(retries.experimentalStrategy).to.eq(experimentalStrategy)
      expect(retries.experimentalOptions?.maxRetries).to.eq(maxRetries)
      expect(retries.experimentalOptions?.passesRequired).to.eq(passesRequired)
      expect(retries.runMode).to.eq(runMode)
      expect(retries.openMode).to.eq(openMode)
    })
  })

  describe('at the test level', () => {
    it('sets the config', {
      retries: {
        experimentalStrategy,
        openMode,
        runMode,
        experimentalOptions: {
          maxRetries,
          passesRequired,
        },
      },
    }, () => {
      const retries = Cypress.config('retries')

      expect(retries.experimentalStrategy).to.eq(experimentalStrategy)
      expect(retries.experimentalOptions?.maxRetries).to.eq(maxRetries)
      expect(retries.experimentalOptions?.passesRequired).to.eq(passesRequired)
      expect(retries.runMode).to.eq(runMode)
      expect(retries.openMode).to.eq(openMode)
    })
  })
})
