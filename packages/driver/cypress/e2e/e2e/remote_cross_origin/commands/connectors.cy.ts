describe('remote driver: connectors in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.each()', () => {
    cy.get('#by-name>[name="colors"]').each(($element) => {
      expect($element.attr('type')).to.equal('checkbox')
    })
  })

  it('.its()', () => {
    cy.get('#by-id>input').its('length').should('eq', 3)
  })

  it('.invoke()', () => {
    cy.get('#button').invoke('text').should('eq', 'button')
  })

  it('.spread()', () => {
    const arr = ['foo', 'bar', 'baz']

    cy.wrap(arr).spread((foo, bar, baz) => {
      expect(foo).to.equal('foo')
      expect(bar).to.equal('bar')
      expect(baz).to.equal('baz')
    })
  })

  it('.then()', () => {
    cy.get('#by-id>input').then(($list) => {
      expect($list).to.have.length(3)
    })
  })
})
