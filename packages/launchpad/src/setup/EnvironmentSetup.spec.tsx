import { EnvironmentSetupFragmentDoc } from '../generated/graphql-test'
import EnvironmentSetup from './EnvironmentSetup.vue'

describe('<EnvironmentSetup />', () => {
  it('playground', { viewportWidth: 800 }, () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      render: (gqlVal) => (
        <div class="m-10">
          <EnvironmentSetup gql={gqlVal} />
        </div>
      ),
    })

    cy.get('[data-testid="select-framework"]').click()
    cy.contains('Nuxt.js').click()
  })
})
