import ExperimentRow from './ExperimentRow.vue'

describe('<ExperimentRow />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <ExperimentRow style={{ resize: 'both', overflow: 'auto'}} experiment={{
        name: 'Studio Mode',
        description: 'Enable Studio Mode',
        enabled: false,
        key: 'experimentalStudio'
      }}>
      </ExperimentRow>
    ))
  })
})
