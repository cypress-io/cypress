describe('cy.origin dependencies - jsx', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('works with a jsx file', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const dayjs = Cypress.require('dayjs')

      expect(dayjs('2022-07-29 12:00:00').format('MMMM D, YYYY')).to.equal('July 29, 2022')
    })
  })
})
