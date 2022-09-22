import RecordRunModalVue from './RecordRunModal.vue'

describe('RecordRunModal', () => {
  it('is not open by default', () => {
    cy.mount(<RecordRunModalVue isModalOpen={false} close={cy.stub()} utmMedium="Nav" />)
  })

  it('renders open', () => {
    cy.mount(<RecordRunModalVue isModalOpen={true} close={cy.stub()} utmMedium="Nav" />)

    cy.contains('Record your first run').should('be.visible')
    cy.findByTestId('copy-button').should('be.visible')

    cy.percySnapshot()
  })

  it('calls close when X is clicked', () => {
    const closeStub = cy.stub()

    cy.mount(<RecordRunModalVue isModalOpen={true} close={closeStub} utmMedium="Nav" />)

    cy.findByRole('button', { name: 'Close' }).click().then(() => {
      expect(closeStub).to.have.been.called
    })
  })

  it('sends UTM parameters with help link', () => {
    cy.mount(<RecordRunModalVue isModalOpen={true} close={cy.stub()} utmMedium="Nav" utmContent="content" />)

    cy.contains('Need help').should('have.attr', 'href', 'https://on.cypress.io/cypress-run-record-key?utm_medium="Nav",utm_source="Binary: Launchpad",utm_content="content"')
  })
})
