import TestingTypePromo from './TestingTypePromo.vue'

describe('<TestingTypePromo />', () => {
  describe('component testing', () => {
    it('renders', () => {
      cy.mount(<TestingTypePromo testingType="component" />)

      cy.percySnapshot()
    })

    it('triggers event on button click', () => {
      const stub = cy.stub().as('activateTestingType')

      cy.mount(<TestingTypePromo testingType="component" onActivateTestingType={stub} />)

      cy.get('button').click()

      cy.get('@activateTestingType').should('have.been.calledOnceWith', 'component')
    })
  })

  describe('e2e testing', () => {
    it('renders', () => {
      cy.mount(<TestingTypePromo testingType="e2e" />)

      cy.percySnapshot()
    })

    it('triggers event on button click', () => {
      const stub = cy.stub().as('activateTestingType')

      cy.mount(<TestingTypePromo testingType="e2e" onActivateTestingType={stub} />)

      cy.get('button').click()

      cy.get('@activateTestingType').should('have.been.calledOnceWith', 'e2e')
    })
  })
})
