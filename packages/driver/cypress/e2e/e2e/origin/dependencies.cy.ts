describe('cy.origin dependencies', () => {
  // it.only('is a standard test', () => {
  //   cy.visit('/fixtures/primary-origin.html')
  //   cy.get('a[data-cy="cross-origin-secondary-link"]')
  // })

  it('uses external dependency', () => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      console.log('🟢 1')

      const _ = require('lodash')
      // import _ from 'lodash' // can this work?

      expect(_.get({ foo: 'foo' }, 'foo')).to.equal('foo')
      expect(true).to.be.true
    })
  })
})
