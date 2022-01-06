import { RecordKeyFragmentDoc } from '../../generated/graphql-test'
import RecordKey from './RecordKey.vue'

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
          <RecordKey gql={gql} settingsUrl="#"/>
        </div>
      ),
    })
  })

  it(`has an input that's hidden by default`, () => {
    cy.get('code').as('Record Key Input')
    .should('be.visible')
    .contains('code', key).should('not.exist')
    .get('[aria-label="Record Key Visibility Toggle"]').as('Password Toggle')
    .click()

    cy.contains('code', key).should('be.visible')
    .get('@Password Toggle')
    .click()

    cy.contains('code', key).should('not.exist')
  })

  it('has a managed keys button', () => {
    // Validate that a link is opened, or at least that the a href attribute is present
    cy.findByText('Manage Keys').should('be.visible').click()
  })
})
