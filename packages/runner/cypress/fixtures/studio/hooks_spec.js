describe('suite', () => {
  before(() => {
    cy.visit('the://url')
    cy.log('beforeHook')
  })

  beforeEach(() => {
    cy.log('beforeEachHook')
  })

  it('test', () => {
    cy.log('testBody')
  })

  afterEach(() => {
    cy.log('afterEachHook')
  })

  after(() => {
    cy.log('afterHook')
  })
})
