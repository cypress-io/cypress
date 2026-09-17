export {} // make typescript see this as a module

// Internal to the driver's test override bookkeeping, so not on the public config type.
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
