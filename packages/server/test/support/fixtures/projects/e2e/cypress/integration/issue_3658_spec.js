describe('issue 3658', () => {
  before(() => {
    Cypress.log({ name: 'before hook' })
  })

  beforeEach(() => {
    Cypress.log({ name: 'before each hook' })
  })

  afterEach(() => {
    Cypress.log({ name: 'after each hook' })
  })

  after(() => {
    Cypress.log({ name: 'after hook' })
  })

  it('works', () => {
    Cypress.log({ name: 'it' })
  })
})
