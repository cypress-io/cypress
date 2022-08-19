import StudioInitModal from './StudioInitModal.vue'

describe('StudioInitModal', () => {
  it('renders hidden by default', () => {
    cy.mount(<StudioInitModal open={false} />)
    cy.findByTestId('studio-init-modal').should('not.exist')
  })

  it('renders open with props', () => {
    cy.mount(<StudioInitModal open />)
    cy.findByTestId('studio-init-modal').should('be.visible')
    cy.percySnapshot()
  })

  it('calls start when user clicks the button', () => {
    const start = cy.stub()

    cy.mount(<StudioInitModal onStart={start} open />)

    cy.findByText('Get Started').click().then(() => {
      expect(start).to.be.calledOnce
    })
  })
})
