import { MigrationWizardFragmentDoc } from '../generated/graphql-test'
import MigrationWizard from './MigrationWizard.vue'

describe('<MigrationWizard/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mountFragment(MigrationWizardFragmentDoc, {
      render (gql) {
        return (<div class="p-16px">
          <MigrationWizard gql={gql} />
        </div>)
      },
    })
  })
})
