import ExperimentRow from './ExperimentRow.vue'

describe('<ExperimentRow />', () => {
  it('renders an experiment with a status', { viewportWidth: 800, viewportHeight: 600 }, () => {
    const exp = {
      name: 'Name',
      description: 'Description of stuff',
      key: 'experiment-key',
      enabled: true,
    }

    cy.mount(() => (
      <ExperimentRow
        class="p-12 w-600px resize overflow-auto"
        experiment={exp}
      />
    ))

    cy.findByText('Enabled').should('be.visible')
    cy.findByText('Disabled').should('not.exist')
    cy.findByText(exp.name).should('be.visible')
    cy.findByText(exp.description).should('be.visible')
    cy.findByText(exp.key).should('be.visible')
  })
})
