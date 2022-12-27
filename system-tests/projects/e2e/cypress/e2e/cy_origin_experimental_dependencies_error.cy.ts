it('uses cy.origin() dependency handling', () => {
  cy.visit('/primary_origin.html')
  cy.get('a[data-cy="cross_origin_secondary_link"]').click()

  cy.origin('foobar.com:4466', () => {
    require('lodash')
  })
})
