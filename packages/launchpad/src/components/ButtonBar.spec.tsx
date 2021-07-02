import ButtonBar from './ButtonBar.vue'

describe('<ButtonBar />', () => {
  it('playground', () => {
    cy.mount(() => <ButtonBar next="Next Step" back="Back" />)
  })

  it('should trigger the next function', () => {
    cy.mount(() => <ButtonBar next="Next Step" back="Back" />).then(() => {
      const nextFunction = cy.spy()

      Cypress.store.setNextFunction(nextFunction)
      cy.contains('Next Step')
      .click()
      .then(() => {
        expect(nextFunction).to.have.been.calledOnce
      })
    })
  })

  it('should trigger the back function', () => {
    cy.mount(() => <ButtonBar next="Next Step" back="Back" />).then(() => {
      const backFunction = cy.spy()

      Cypress.store.setBackFunction(backFunction)
      cy.contains('Back')
      .click()
      .then(() => {
        expect(backFunction).to.have.been.calledOnce
      })
    })
  })
})
