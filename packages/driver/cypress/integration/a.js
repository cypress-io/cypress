beforeEach(() => {
  cy.visit('fixtures/dom.html')
})

it('t', () => {
  cy.get('#tabindex')
  .should('have.prop', 'tabindex', 1)
  .then((e) => {
    expect(e).not.to.eql(1)
  })
})

it('t2', () => {
  cy.get('select[name=disabled]')
  .should('have.prop', 'disabled', true)
  .then((e) => {
    expect(e).not.to.eql(true)
  })
})

it('t3', () => {
  cy.get('#table')
  .then((el) => el.attr('id'))
  //.should('have.prop', 'id')
  .then((e) => {
    expect(typeof e).to.eq('string')
    expect(e).to.eq('table')
  })
})

it('t4', () => {
  cy.get('#table')
  .then((el) => el.attr('it should not exist'))
  .then((e) => {
    expect(e.attr('id')).to.eq('table')
  })
})
