// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import ConfigLegend from './ConfigLegend.vue'
import { each } from 'lodash'
import { OpenConfigFileInIdeFragmentDoc } from '../../generated/graphql-test'

const legend = defaultMessages.settingsPage.config.legend

describe('<ConfigLegend/>', () => {
  it('renders', () => {
    cy.mountFragment(OpenConfigFileInIdeFragmentDoc, {
      render: (gql) => <ConfigLegend gql={gql} />,
    })

    cy.get('[data-cy="external"]').should('have.attr', 'href').and('eq', 'https://on.cypress.io/setup-node-events')

    each(legend, ({ label, description }) => {
      cy.contains(label)
      each(description.split('{0}'), (desc) => desc && cy.contains(desc))
    })

    cy.percySnapshot()
  })
})
