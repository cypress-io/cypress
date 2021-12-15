import { RenameSpecsAutoFragmentDoc } from '../generated/graphql-test'
import RenameSpecsAuto from './RenameSpecsAuto.vue'

describe('<RenameSpecsAuto/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mountFragment(RenameSpecsAutoFragmentDoc, {
      render (gql) {
        return (<div class="p-16px">
          <RenameSpecsAuto gql={gql} />
        </div>)
      },
    })
  })
})
