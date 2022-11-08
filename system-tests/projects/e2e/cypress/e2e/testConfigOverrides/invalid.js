const shouldNotExecute = () => {
  expect(1).to.eq(1) // should not execute - use passing test to ensure correct fail count in system test
}

it('inline test config override throws error', () => {
  Cypress.config('baseUrl', '')
})

it('inline test config override throws error when executed within cy cmd', () => {
  cy.then(() => {
    Cypress.config('baseUrl', 'null')
  })
})

describe('context config overrides throws error', { retries: '1' }, () => {
  it('runs', () => {
    shouldNotExecute()
  })
})

describe('nested contexts overrides throws error at the correct line number', { defaultCommandTimeout: '500' }, () => {
  it('1st test fails on overrides', () => {
    shouldNotExecute()
  })

  it('2nd test fails on overrides', () => {
    shouldNotExecute()
  })
})

describe('nested contexts ', () => {
  describe('test override', () => {
    it('throws error at the correct line number', { baseUrl: 'not_an_http_url' }, () => {
      shouldNotExecute()
    })

    it('does execute 2nd test', () => {
      expect(1).to.eq(1)
    })
  })
})

describe('throws error correctly when before hook', () => {
  before(() => {})
  it('test config override throws error', { retries: '1' }, () => {
    shouldNotExecute()
  })
})

describe('throws error correctly when beforeEach hook', () => {
  beforeEach(() => {})
  it('test config override throws error', { retries: '1' }, () => {
    shouldNotExecute()
  })
})

it('throws error when invalid test-level override', { testIsolation: 'off' }, () => {
  shouldNotExecute()
})

it('throws error when invalid config opt in Cypress.config() in test', () => {
  Cypress.config({ testIsolation: 'off' })
  shouldNotExecute()
})

describe('throws error when invalid config opt in Cypress.config() in before hook', () => {
  before(() => {
    Cypress.config({ testIsolation: 'off' })
  })

  it('4', () => {
    shouldNotExecute()
  })
})

describe('throws error when invalid config opt in Cypress.config() in beforeEach hook', () => {
  beforeEach(() => {
    Cypress.config({ testIsolation: 'off' })
  })

  it('5', () => {
    shouldNotExecute()
  })
})

describe('throws error when invalid config opt in Cypress.config() in after hook', () => {
  after(() => {
    Cypress.config({ testIsolation: 'off' })
  })

  it('5', () => {
    shouldNotExecute()
  })
})

describe('throws error when invalid config opt in Cypress.config() in afterEach hook', () => {
  afterEach(() => {
    Cypress.config({ testIsolation: 'off' })
  })

  it('5', () => {
    shouldNotExecute()
  })
})
