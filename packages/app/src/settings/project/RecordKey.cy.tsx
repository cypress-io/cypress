import { RecordKeyFragmentDoc } from '../../generated/graphql-test'
import RecordKey from './RecordKey.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<RecordKey />', () => {
  const key = '1234-bbbb-5678-dddd'

  beforeEach(() => {
    cy.viewport(800, 600)
    cy.mountFragment(RecordKeyFragmentDoc, {
      onResult: (res) => {
        res.key = key
      },
      render: (gql) => (
        <div class="py-4 px-8">
          <RecordKey gql={gql} manageKeysUrl="http://project.cypress.io/settings" />
        </div>
      ),
    })
  })

  it('renders the Record Key view with the correct title', () => {
    cy.findByText('Record key')
  })

  it(`has an input that's hidden by default`, () => {
    cy.get('code').as('Record key input')
    .should('be.visible')
    .contains('code', key).should('not.exist')
    .get('[aria-label="Record Key Visibility Toggle"]').as('Password Toggle')
    .click()

    cy.contains('code', key).should('be.visible')
    .get('@Password Toggle')
    .click()

    cy.contains('code', key).should('not.exist')
  })

  it('has a managed keys button and copy button', () => {
    // the functionality of this button triggers a mutation so is tested in the settings page e2e tests
    cy.contains('button', defaultMessages.settingsPage.recordKey.manageKeys)
    .should('be.visible')
    .and('not.be.disabled')

    cy.contains('button', defaultMessages.clipboard.copy)
    .should('be.visible')
    .and('not.be.disabled')
  })
})
