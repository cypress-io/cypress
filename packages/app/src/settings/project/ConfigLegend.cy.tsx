import { defaultMessages } from '@cy/i18n'
import ConfigLegend from './ConfigLegend.vue'
import { each } from 'lodash'

const legend = defaultMessages.settingsPage.config.legend

describe('<ConfigLegend/>', () => {
  it('renders', () => {
    cy.mount(ConfigLegend)

    each(legend, ({ label, description }) => {
      cy.contains(label)
      each(description.split('{0}'), (desc) => desc && cy.contains(desc))
    })

    cy.percySnapshot()
  })
})
