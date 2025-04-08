import RecordRunModalVue from './RecordRunModal.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { UsePromptManager_SetProjectPreferencesDocument } from '../generated/graphql-test'

describe('RecordRunModal', () => {
  it('renders and records that it has been shown', () => {
    const now = Date.now()

    cy.clock(now)
    const setPreferencesStub = cy.stub()

    cy.stubMutationResolver(UsePromptManager_SetProjectPreferencesDocument, (defineResult, { value }) => {
      setPreferencesStub(JSON.parse(value))
    })

    cy.mount(<RecordRunModalVue utmMedium="Nav" />)

    cy.contains(defaultMessages.specPage.banners.record.title).should('be.visible')
    cy.findByTestId('copy-button').should('be.visible')

    cy.findByDisplayValue('npx cypress run --record --key 2aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa').should('be.visible')
    cy.wrap(setPreferencesStub).should('have.been.calledWithMatch', { promptsShown: { loginModalRecord: now } })

    cy.percySnapshot()
  })

  it('calls close when X is clicked', () => {
    const closeStub = cy.stub()

    cy.mount(<RecordRunModalVue onCancel={closeStub} utmMedium="Nav" />)

    cy.findByRole('button', { name: defaultMessages.actions.close }).click().then(() => {
      expect(closeStub).to.have.been.called
    })
  })

  it('sends UTM parameters with help link', () => {
    cy.mount(<RecordRunModalVue utmMedium="Nav" utmContent="content" />)

    cy.contains(defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/cypress-run-record-key?utm_medium=Nav&utm_source=Binary%3A+Launchpad&utm_content=content')
  })

  it('sends UTM parameters with help link without UTM content prop', () => {
    cy.mount(<RecordRunModalVue utmMedium="Nav" />)

    cy.contains(defaultMessages.links.needHelp).should('have.attr', 'href', 'https://on.cypress.io/cypress-run-record-key?utm_medium=Nav&utm_source=Binary%3A+Launchpad&utm_content=')
  })
})
