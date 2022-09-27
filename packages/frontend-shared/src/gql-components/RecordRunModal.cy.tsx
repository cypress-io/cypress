import RecordRunModalVue from './RecordRunModal.vue'
import { defaultMessages } from '@cy/i18n'

describe('RecordRunModal', () => {
  it('is not open by default', () => {
    cy.mount(<RecordRunModalVue isModalOpen={false} close={cy.stub()} utmMedium="Nav" />)

    cy.findByTestId('record-run-modal').should('not.exist')
  })

  it('renders open', () => {
    cy.mount(<RecordRunModalVue isModalOpen={true} close={cy.stub()} utmMedium="Nav" />)

    cy.contains(defaultMessages.specPage.banners.record.title).should('be.visible')
    cy.findByTestId('copy-button').should('be.visible')

    cy.contains('npx cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').should('be.visible')

    cy.percySnapshot()
  })

  it('calls close when X is clicked', () => {
    const closeStub = cy.stub()

    cy.mount(<RecordRunModalVue isModalOpen={true} close={closeStub} utmMedium="Nav" />)

    cy.findByRole('button', { name: defaultMessages.actions.close }).click().then(() => {
      expect(closeStub).to.have.been.called
    })
  })

  it('sends UTM parameters with help link', () => {
    cy.mount(<RecordRunModalVue isModalOpen={true} close={cy.stub()} utmMedium="Nav" utmContent="content" />)

    cy.contains(defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/cypress-run-record-key?utm_medium=Nav&utm_source=Binary%3A+Launchpad&utm_content=content')
  })

  it('sends UTM parameters with help link without UTM content prop', () => {
    cy.mount(<RecordRunModalVue isModalOpen={true} close={cy.stub()} utmMedium="Nav" />)

    cy.contains(defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/cypress-run-record-key?utm_medium=Nav&utm_source=Binary%3A+Launchpad&utm_content=')
  })
})
