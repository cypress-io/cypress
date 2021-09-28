import ExperimentRow from './ExperimentRow.vue'
import { experiments } from './projectSettings'

describe('<ExperimentRow />', () => {
  it('renders an experiment with a status', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <ExperimentRow
        className="resize overflow-auto w-600px p-12"
        experiment={{
          ...experiments[0],
          enabled: true,
        }}
      />
    ))

    cy.findByText('Enabled').should('be.visible')
    cy.findByText('Disabled').should('not.exist')
    cy.findByText(experiments[0].name).should('be.visible')
    cy.findByText(experiments[0].description).should('be.visible')
    cy.findByText(experiments[0].key).should('be.visible')
  })
})
