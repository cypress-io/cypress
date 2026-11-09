import ConfigLegend from './ConfigLegend.vue'
import { each } from 'lodash'
import { OpenConfigFileInIdeFragmentDoc } from '../../generated/graphql-test'

const legend = [
  { label: 'env', description: 'Set from environment variables' },
  { label: 'default', description: 'Default values' },
  { label: 'dynamic', description: 'Set by the {0} function' },
  { label: 'cli', description: 'Set from CLI arguments' },
  { label: 'config', description: 'Set from {0}' },
]

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
