Cypress.config().isInteractive = false

describe('executes within a reasonable timeframe', function () {
  this.timeout(5000)

  const COUNT = 200

  Cypress._.times(COUNT, (n) => {
    it(`${n} test`, () => {
      expect(true).to.be.true
    })
  })
})
