import StudioInstructionsModal from './StudioInstructionsModal.vue'

describe('StudioInstructionsModal', () => {
  it('renders hidden by default', () => {
    cy.mount(<StudioInstructionsModal open={false} />)
    cy.findByTestId('studio-instructions-modal').should('not.exist')
  })

  it('renders open with props', () => {
    cy.mount(<StudioInstructionsModal open />)
    cy.findByTestId('studio-instructions-modal').should('be.visible')
    cy.percySnapshot()
  })
})
