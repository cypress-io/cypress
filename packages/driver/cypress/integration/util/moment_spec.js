context('#moment', () => {
  it('logs deprecation warning', () => {
    cy.stub(Cypress.utils, 'warning')

    Cypress.moment()
    expect(Cypress.utils.warning).to.be.calledWith('`Cypress.moment()` has been deprecated and will be replaced in a future release. Consider migrating to a different datetime formatter.')
  })

  it('still has other moment properties', () => {
    expect(Cypress.moment.duration).to.be.a('function')
    expect(Cypress.moment.isDate()).to.be.false
    expect(Cypress.moment.isDate(new Date())).to.be.true
  })
})
