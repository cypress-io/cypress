import Config from './Config.vue'
import cypressConfig from '../../../cypress.config'
import { defaultMessages } from '@cy/i18n'
import { each } from 'lodash'

describe('<Config/>', () => {
  it('renders the title, description, code, and legend', () => {
    cy.mount(() => <div class="p-12 resize-x overflow-auto"><Config /></div>)
    cy.get('[data-testid=config-code]').contains(JSON.stringify(cypressConfig, null, 2))
    cy.contains(defaultMessages.settingsPage.config.title)

    // TODO: write a support file helper for ignoring the {0} values etc
    each(defaultMessages.settingsPage.config.description.split('{0}'), (description) => {
      cy.contains(description)
    })
  })
})
