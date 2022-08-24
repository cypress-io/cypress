import StudioUrlPrompt from './StudioUrlPrompt.vue'

describe('<StudioUrlPrompt />', () => {
  it('renders', () => {
    cy.mount(<StudioUrlPrompt urlInProgress="" />)
    cy.percySnapshot()
  })

  it('emits cancel when button is clicked', () => {
    const cancelStub = cy.stub()

    cy.mount(<StudioUrlPrompt urlInProgress="" onCancel={cancelStub}/>)

    cy.findByText('Cancel').click().then(() => {
      expect(cancelStub).to.be.called
    })
  })

  it('disables submit button when url field is empty', () => {
    const continueStub = cy.stub()

    cy.mount(<StudioUrlPrompt urlInProgress="" onSubmit={continueStub}/>)

    cy.findByText('Continue ➜').should('be.disabled')
  })

  it('emits submit when continue button is clicked', () => {
    const continueStub = cy.stub()

    const url = 'http://localhost:8080'

    cy.mount(<StudioUrlPrompt urlInProgress={url} onSubmit={continueStub}/>)

    cy.findByText('Continue ➜').click().then(() => {
      expect(continueStub).to.be.called
    })
  })
})
