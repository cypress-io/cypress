import DebugPendingRunSplash from './DebugPendingRunSplash.vue'

describe('<DebugPendingRunSplash />', () => {
  it('renders as expected', () => {
    cy.mount(<DebugPendingRunSplash/>)

    cy.contains('Failures will be displayed here')

    cy.percySnapshot()
  })

  it('renders scheduled to complete message', () => {
    cy.mount(<DebugPendingRunSplash isCompletionScheduled={true}/>)

    cy.contains('Scheduled to complete...')
    cy.findByTestId('splash-subtitle').should('not.exist')

    cy.percySnapshot()
  })
})
