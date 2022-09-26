/// <reference types="cypress" />
describe('this context', () => {
  beforeEach(() => {
    cy.wrap(42).as('life')
  })

  it('preserves the test context', function () {
    expect(this).to.be.an('object')
    expect(this.life).to.equal(42)
  })
})
