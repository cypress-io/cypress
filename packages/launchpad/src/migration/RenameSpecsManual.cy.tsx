import { RenameSpecsManualFragmentDoc } from '../generated/graphql-test'
import RenameSpecsManual from './RenameSpecsManual.vue'

describe('<RenameSpecsManual/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mountFragment(RenameSpecsManualFragmentDoc, {
      render (gql) {
        return (
          <div class="p-[16px]">
            <RenameSpecsManual gql={gql} />
          </div>
        )
      },
    })
  })
})
