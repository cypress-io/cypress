import { defaultMessages } from '@cy/i18n'
import ConfigLegend from './ConfigLegend.vue'
import { each } from 'lodash'
import { ConfigLegendFragmentDoc } from '../../generated/graphql-test'

const legend = defaultMessages.settingsPage.config.legend

describe('<ConfigLegend/>', () => {
  it('renders', () => {
    cy.mountFragment(ConfigLegendFragmentDoc, {
      render (gqlVal) {
        return <ConfigLegend gql={gqlVal} />
      },
    })

    each(legend, ({ label, description }) => {
      cy.contains(label)
      each(description.split('{0}'), (desc) => desc && cy.contains(desc))
    })
  })
})
