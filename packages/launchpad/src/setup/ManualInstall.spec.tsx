import { ManualInstallFragmentDoc } from '../generated/graphql-test'
import ManualInstall from './ManualInstall.vue'

describe('<ManualInstall />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mountFragment(ManualInstallFragmentDoc, {
      type: (ctx) => {
        ctx.wizard.setFramework('nextjs')
        ctx.wizard.setBundler('webpack')

        return ctx.wizard
      },
      render: (gqlVal) => (
        <div class="m-10 border-1 rounded border-gray-400">
          <ManualInstall gql={gqlVal} />
        </div>
      ),
    })
  })
})
