const shouldNotExecute = () => {
  throw new Error('Test Override validation should have failed & it block should not have executed.')
}

it('first should not run', () => {
  shouldNotExecute()
})

describe('second should not run', () => {
  it('test', () => {
    shouldNotExecute()
  })
})

describe('nested contexts ', { retries: 1 }, () => {
  // eslint-disable-next-line mocha/no-exclusive-tests
  describe.only('test override', () => {
    it('updates as expected', { baseUrl: null }, () => {
      const config = Cypress.config()

      expect(config.testConfigList).to.be.undefined
      expect(config.unverifiedTestConfig).to.be.undefined
      expect(config.baseUrl).to.be.null
      expect(config.retries).to.eq(1)
    })
  })
})
