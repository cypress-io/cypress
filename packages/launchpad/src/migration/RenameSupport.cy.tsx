import { RenameSupportFragmentDoc } from '../generated/graphql-test'
import RenameSupport from './RenameSupport.vue'

describe('<RenameSpecsManual/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mountFragment(RenameSupportFragmentDoc, {
      render (gql) {
        return (<div class="p-[16px]">
          <RenameSupport gql={gql} />
        </div>)
      },
    })
  })
})
