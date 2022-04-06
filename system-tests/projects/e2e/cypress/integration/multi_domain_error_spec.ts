describe('multi-domain', () => {
  beforeEach(() => {
    cy.visit('/multi_domain.html')
    cy.get('a[data-cy="multi_domain_secondary_link"]').click()
  })

  it('tries to find an element that doesn\'t exist and fails', () => {
    cy.origin('http://foobar.com:4466', () => {
      cy.get('#doesnotexist', {
        timeout: 1000,
      })
    })
  })
})
