describe('cy.origin test dependencies', () => {
  beforeEach(() => {
    cy.visit('/primary_origin.html')
    cy.get('a[data-cy="cross_origin_secondary_link"]').click()
  })

  it('uses Cypress.require()', function () {
    cy.origin('http://foobar.com:4466', () => {
      const { add } = Cypress.require('../support/util')

      expect(add(2, 2)).to.equal(4)
    })
  })
})
