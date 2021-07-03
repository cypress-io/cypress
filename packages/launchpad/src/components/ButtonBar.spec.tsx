import ButtonBar from './ButtonBar.vue'

describe('<ButtonBar />', () => {
  it('playground', () => {
    cy.mount(() => <ButtonBar next="Next Step" back="Back" />)
  })

  it('should trigger the next function', () => {
    cy.mount(() => <ButtonBar next="Next Step" back="Back" />).then(() => {
      const nextFunction = cy.spy()

      Cypress.store.onNext(nextFunction)
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

      Cypress.store.onBack(backFunction)
      cy.contains('Back')
      .click()
      .then(() => {
        expect(backFunction).to.have.been.calledOnce
      })
    })
  })

  it('should show a switch on the right when alt is mentionned and onAlt is set', () => {
    cy.mount(() => (
      <ButtonBar next="Next Step" back="Back" alt="Install manually" />
    )).then(() => {
      const altFunction = cy.spy()

      Cypress.store.onAlt(altFunction)
      cy.contains('Install manually')
      .click()
      .then(() => {
        expect(altFunction).to.have.been.calledOnce
      })
    })
  })
})
