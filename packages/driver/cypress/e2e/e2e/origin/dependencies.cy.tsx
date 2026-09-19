describe('cy.origin dependencies - tsx', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('works with a tsx file', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')
    })
  })
})
