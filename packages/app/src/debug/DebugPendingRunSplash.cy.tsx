import DebugPendingRunSplash from './DebugPendingRunSplash.vue'

describe('<DebugPendingRunSplash />', () => {
  it('renders as expected', () => {
    cy.mount(<DebugPendingRunSplash/>)

    cy.gqlStub

    cy.contains('3 of 5').should('be.visible')

    cy.percySnapshot()
  })
})
