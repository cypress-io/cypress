import DebugPendingRunSplash from './DebugPendingRunSplash.vue'

describe('<DebugPendingRunSplash />', () => {
  it('renders as expected', () => {
    cy.mount(<DebugPendingRunSplash/>)

    cy.findByTestId('title').contains('Testing in progress...')
    cy.findByTestId('splash-subtitle').contains('Failures will be displayed here')
  })

  it('renders scheduled to complete message', () => {
    cy.mount(<DebugPendingRunSplash isCompletionScheduled={true}/>)

    cy.contains('Scheduled to complete...')
    cy.findByTestId('splash-subtitle').should('not.exist')
  })
})
