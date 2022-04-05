describe('multi-domain test retries', () => {
  beforeEach(() => {
    cy.visit('/multi_domain.html')
    cy.get('a[data-cy="multi_domain_secondary_link"]').click()
  })

  it('appropriately retries test within "switchToDomain" without propagating other errors errors', function () {
    cy.switchToDomain('http://foobar.com:4466', () => {
      cy.then(() => {
        expect(true).to.be.false
      })
    })
  })
})
