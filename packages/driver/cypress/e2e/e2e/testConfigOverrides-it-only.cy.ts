export {} // make typescript see this as a module

// The driver strips these internal bookkeeping keys off the resolved config
// before handing it to the test, so they are not part of the public type.
type ConfigWithTestOverrideInternals = Cypress.Config & {
  testConfigList?: unknown
  unverifiedTestConfig?: unknown
}

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

describe('correctly applies overrides when valid configuration', { retries: 1 }, () => {
  // eslint-disable-next-line mocha/no-exclusive-tests
  it.only('for it.only', { baseUrl: null }, () => {
    const config = Cypress.config() as ConfigWithTestOverrideInternals

    expect(config.testConfigList).to.be.undefined
    expect(config.unverifiedTestConfig).to.be.undefined
    expect(config.baseUrl).to.be.null
    expect(config.retries).to.eq(1)
  })
})
