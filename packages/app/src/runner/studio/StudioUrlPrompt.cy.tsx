import StudioUrlPrompt from './StudioUrlPrompt.vue'

describe('<StudioUrlPrompt />', () => {
  it('renders', () => {
    cy.mount(<StudioUrlPrompt urlInProgress="" overlayZIndex={50} />)
    cy.percySnapshot()
  })

  it('zindex of overlay matches passed in zindex', () => {
    cy.mount(<StudioUrlPrompt urlInProgress="" overlayZIndex={99} />)
    cy.get('[cy-data="studio-url-overlay"]').should('have.css', 'z-index', '99')
  })

  it('emits cancel when button is clicked', () => {
    const cancelStub = cy.stub()

    cy.mount(<StudioUrlPrompt urlInProgress="" overlayZIndex={50} onCancel={cancelStub}/>)

    cy.findByText('Cancel').click().then(() => {
      expect(cancelStub).to.be.called
    })
  })

  it('disables submit button when url field is empty', () => {
    const continueStub = cy.stub()

    cy.mount(<StudioUrlPrompt urlInProgress="" overlayZIndex={50} onSubmit={continueStub}/>)

    cy.findByText('Continue ➜').should('be.disabled')
  })

  it('emits submit when continue button is clicked', () => {
    const continueStub = cy.stub()

    const url = 'http://localhost:8080'

    cy.mount(<StudioUrlPrompt urlInProgress={url} overlayZIndex={50} onSubmit={continueStub}/>)

    cy.findByText('Continue ➜').click().then(() => {
      expect(continueStub).to.be.called
    })
  })
})
