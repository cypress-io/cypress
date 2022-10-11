describe('cy.origin', () => {
  beforeEach(() => {
    cy.visit('/primary_origin.html')
    cy.get('a[data-cy="cross_origin_secondary_link"]').click()
  })

  it('tries to find an element that doesn\'t exist and fails', () => {
    cy.origin('http://www.foobar.com:4466', () => {
      cy.get('#doesnotexist', {
        timeout: 1000,
      })
    })
  })
})
