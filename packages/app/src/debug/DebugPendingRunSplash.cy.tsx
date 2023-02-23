import DebugPendingRunSplash from './DebugPendingRunSplash.vue'

describe('<DebugPendingRunSplash />', () => {
  it('renders as expected', () => {
    cy.mount(<DebugPendingRunSplash/>)

    cy.contains('Failures will be displayed here')

    cy.percySnapshot()
  })
})
