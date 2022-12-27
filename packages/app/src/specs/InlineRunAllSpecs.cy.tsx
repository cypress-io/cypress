import InlineRunAllSpecs from './InlineRunAllSpecs.vue'

describe('<InlineRunAllSpecs/>', { viewportHeight: 50, viewportWidth: 150 }, () => {
  context('Correctly rendered for Inline Specs list', () => {
    beforeEach(() => {
      const runAllStub = cy.stub().as('runAllStub')

      cy.mount(() => {
        return (
          <div class="flex justify-center">
            <InlineRunAllSpecs specNumber={40} directory='cypress/e2e' onRunAllSpecs={runAllStub}/>
          </div>
        )
      })
    })

    it('renders component correctly', () => {
      cy.findByTestId('run-all-specs-for-cypress/e2e').children().should('have.length', 1)
      cy.findByTestId('play-button').should('be.visible')
    })

    it('provides expected tooltip content', () => {
      cy.findByTestId('tooltip-content').should('not.exist')
      cy.findByTestId('run-all-specs-for-cypress/e2e').realHover().then(() => {
        cy.findByTestId('tooltip-content').should('contain.text', 'Run 40 specs')
      })
    })

    it('emits expected event', () => {
      cy.get('button').click()

      cy.get('@runAllStub').should('have.been.calledOnce')
    })
  })

  it('disables button when no specs are available', () => {
    cy.mount(() => {
      return (
        <div class="flex justify-center">
          <InlineRunAllSpecs specNumber={0} directory='cypress/e2e' />
        </div>
      )
    })

    cy.findByTestId('run-all-specs-button').should('be.disabled')
  })
})
