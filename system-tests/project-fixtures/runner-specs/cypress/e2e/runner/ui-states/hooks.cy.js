describe('Hooks', () => {
  before(() => {
    cy.log('command in "before" hook')
  })

  beforeEach(() => {
    cy.log('command in "beforeEach" hook')
  })

  it('test hooks', () => {
    cy.log('command in "it" test')
  })

  afterEach(() => {
    cy.log('command in "afterEach" hook')
  })

  after(() => {
    cy.log('command in "after" hook')
  })
})
