import StudioUrlPrompt from './StudioUrlPrompt.vue'

describe('<StudioUrlPrompt />', () => {
  it('renders', () => {
    cy.mount(<StudioUrlPrompt />)
    cy.percySnapshot()
  })

  it('emits cancel when button is clicked', () => {
    const cancelStub = cy.stub()

    cy.mount(<StudioUrlPrompt onCancel={cancelStub}/>)

    cy.findByText('Cancel').click().then(() => {
      expect(cancelStub).to.be.called
    })
  })

  it('emits submit when continue button is clicked', () => {
    const continueStub = cy.stub()

    cy.mount(<StudioUrlPrompt onSubmit={continueStub}/>)

    cy.findByText('Continue ➜').click().then(() => {
      expect(continueStub).to.be.called
    })
  })
})
