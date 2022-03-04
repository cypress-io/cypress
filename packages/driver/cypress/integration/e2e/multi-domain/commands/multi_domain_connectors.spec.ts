// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain connectors', { experimentalSessionSupport: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.each()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-name>[name="colors"]').each(($element, index) => {
        expect($element.prop('type')).to.equal('checkbox')
      })
    })
  })

  it('.its()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id>input').its('length').should('eq', 3)
    })
  })

  it('.invoke()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#button').invoke('text').should('eq', 'button')
    })
  })

  it('.spread()', () => {
    cy.switchToDomain('foobar.com', () => {
      const arr = ['foo', 'bar', 'baz']

      cy.wrap(arr).spread((foo, bar, baz) => {
        expect(foo).to.equal('foo')
        expect(bar).to.equal('bar')
        expect(baz).to.equal('baz')
      })
    })
  })

  it('.then()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.get('#by-id>input').then(($list) => {
        expect($list).to.have.length(3)
      })
    })
  })
})
