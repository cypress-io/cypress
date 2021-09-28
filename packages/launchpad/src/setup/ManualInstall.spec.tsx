import { ManualInstallFragmentDoc } from '../generated/graphql-test'
import ManualInstall from './ManualInstall.vue'

describe('<ManualInstall />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mountFragment(ManualInstallFragmentDoc, {
      type: (ctx) => {
        return ctx.stubWizard
      },
      render: (gqlVal) => (
        <div class="m-10 border-1 rounded border-gray-400">
          <ManualInstall gql={gqlVal} />
        </div>
      ),
    })
  })
})
