import { EnvironmentSetupFragmentDoc } from '../generated/graphql-test'
import EnvironmentSetup from './EnvironmentSetup.vue'
import type { WizardSetupData } from './Wizard.vue'

describe('<EnvironmentSetup />', () => {
  it('playground', { viewportWidth: 800 }, () => {
    const wizardSetupData: WizardSetupData = {
      bundler: 'webpack',
      framework: 'react',
      codeLanguage: 'ts',
    }

    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      render: (gqlVal) => (
        <div class="m-10">
          <EnvironmentSetup
            gql={gqlVal}
            data={wizardSetupData}
          />
        </div>
      ),
    })

    cy.get('[data-testid="select-framework"]').click()
    cy.contains('Nuxt.js').click()
  })
})
