import ExperimentRow from './ExperimentRow.vue'

describe('<ExperimentRow />', () => {
  const exp = {
    name: 'Name of Enabled Experiment',
    description: 'Description of stuff',
    key: 'experiment-key-enabled',
    enabled: true,
  }

  const expDisabled = {
    name: 'Name of Enabled Experiment',
    description: 'Description of disabled experiments',
    key: 'experiment-key-disabled',
    enabled: false,
  }

  it('renders experiments with both statuses', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <div class="flex flex-col p-[24px] gap-[12px]">
        <ExperimentRow data-cy={exp.key} experiment={exp} class="py-[24px]"/>
        <ExperimentRow data-cy={expDisabled.key} experiment={expDisabled} class="py-[24px]"/>
      </div>
    ))

    cy.get(`[data-cy="${exp.key}"]`).within(() => {
      cy.findByText('Enabled').should('be.visible')
      cy.findByText('Disabled').should('not.exist')
      cy.findByText(exp.name).should('be.visible')
      cy.findByText(exp.description).should('be.visible')
      cy.findByText(exp.key).should('be.visible')
    })

    cy.get(`[data-cy="${expDisabled.key}"]`).within(() => {
      cy.findByText('Disabled').should('be.visible')
      cy.findByText('Enabled').should('not.exist')
      cy.findByText(expDisabled.name).should('be.visible')
      cy.findByText(expDisabled.description).should('be.visible')
      cy.findByText(expDisabled.key).should('be.visible')
    })
  })
})
