import Config from './Config.vue'
import jsonObject from '../../../cypress.json?raw'
import { defaultMessages } from '../../locales/i18n'
import { each } from 'lodash'

describe('<Config/>', () => {
  it('renders the title, description, code, and legend', { viewportHeight: 800, viewportWidth: 1200 }, () => {
    cy.mount(() => <div class="p-12 resize-x overflow-auto"><Config /></div>)
    cy.get('[data-testid=config-code]').contains(jsonObject)
    cy.contains(defaultMessages.settingsPage.config.title)

    // TODO: write a support file helper for ignoring the {0} values etc
    each(defaultMessages.settingsPage.config.description.split('{0}'), (description) => {
      cy.contains(description)
    })
  })
})
