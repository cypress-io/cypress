import Config from './Config.vue'
import { defaultMessages } from '@cy/i18n'
import { each } from 'lodash'
import { ConfigFragmentDoc } from '../../generated/graphql-test'

describe('<Config/>', () => {
  it('renders the title, description, code, and legend', () => {
    cy.mountFragment(ConfigFragmentDoc, {
      render (gql) {
        return (<div class="p-12 resize-x overflow-auto">
          <Config gql={gql}/>
        </div>)
      },
    })

    cy.findByTestId('config-code').contains('reporter')
    cy.contains(defaultMessages.settingsPage.config.title)

    // TODO: write a support file helper for ignoring the {0} values etc
    each(defaultMessages.settingsPage.config.description.split('{0}'), (description) => {
      cy.contains(description)
    })
  })
})
