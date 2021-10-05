import { RecordKeyFragmentDoc } from '../../generated/graphql-test'
import RecordKey from './RecordKey.vue'

describe('<RecordKey />', () => {
  beforeEach(() => {
    cy.viewport(800, 600)
    cy.mountFragment(RecordKeyFragmentDoc, {
      type: (ctx) => {
        return ctx.stubCloudData.CloudRecordKeyStubs.e2eProject
      },
      render: (gql) => (
        <div class="py-4 px-8">
          <RecordKey gql={gql} />
        </div>
      ),
    })
  })

  it('renders the record key view with the correct title', () => {
    cy.findByText('Record Key')
  })

  it(`has an input that's hidden by default`, () => {
    cy.get('input[type="password"]').as('Record Key Input')
    .should('be.visible')
    .get('[aria-label="Record Key Visibility Toggle"]').as('Password Toggle')
    .click()
    .get('input[type="password"]').should('not.exist')
    .get('input[type="text"]').should('be.visible')
    .get('@Password Toggle')
    .click()
    .get('input[type="text"]').should('not.exist')
    .get('input[type="password"]').should('be.visible')
  })

  it('has a managed keys button', () => {
    // Validate that a link is opened, or at least that the a href attribute is present
    cy.findByText('Manage Keys').should('be.visible').click()
  })
})
