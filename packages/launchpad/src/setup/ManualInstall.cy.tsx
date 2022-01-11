import { ManualInstallFragmentDoc } from '../generated/graphql-test'
import ManualInstall from './ManualInstall.vue'

describe('<ManualInstall />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mountFragment(ManualInstallFragmentDoc, {
      render: (gqlVal) => (
        <div class="rounded border-1 border-gray-400 m-10">
          <ManualInstall gql={gqlVal} />
        </div>
      ),
    })
  })
})
