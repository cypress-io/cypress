import { ExperimentsFragmentDoc } from '../../generated/graphql-test'
import config from '@packages/frontend-shared/cypress/fixtures/config.json'
import Experiments from './Experiments.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<Experiments />', { viewportWidth: 800, viewportHeight: 600 }, () => {
  let experimentEntries = config.filter((a) => a.field.startsWith('experimental'))

  it('renders experiments that are passed in', () => {
    cy.mountFragment(ExperimentsFragmentDoc, {
      render (gql) {
        return (<div class="py-4 px-8">
          <Experiments gql={gql} />
        </div>)
      },
    })

    experimentEntries.forEach((exp) => {
      const expName = defaultMessages.settingsPage.experiments[exp.field].name

      cy.contains(`[data-cy="experiment-${exp.field}"]`, expName)
      .should('contain', exp.value ? 'Enabled' : 'Disabled')
    })
  })
})
