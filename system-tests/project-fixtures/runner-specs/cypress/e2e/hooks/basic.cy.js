describe('my test', () => {
  before(() => {
    cy.log('beforeHook 1')
  })

  beforeEach(() => {
    cy.log('beforeEachHook 1')
  })

  it('tests 1', () => {
    cy.log('testBody 1')
  })

  describe('nested suite', () => {
    before(() => {
      cy.log('beforeHook 2')
    })

    before(() => {
      cy.log('beforeHook 3')
    })

    beforeEach(() => {
      cy.log('beforeEachHook 2')
    })

    it('tests 2', () => {
      cy.log('testBody 2')
    })

    afterEach(() => {
      cy.log('afterEachHook 2')
    })

    after(() => {
      cy.log('afterHook 2')
    })
  })

  afterEach(() => {
    cy.log('afterEachHook 1')
  })

  after(() => {
    cy.log('afterHook 1')
  })
})
