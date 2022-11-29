import DebugFailedTest from './DebugFailedTest.vue'

describe('<DebugSpec/>', () => {
  it('mounts correctly', () => {
    const failedTest: string[] = ['App: Runs', 'should fetch newer runs and maintain them when navigating']

    cy.mount(() => (
      <DebugFailedTest failedTest={failedTest} />
    ))

    cy.findByTestId('test-row').children().should('have.length', 3)
    cy.findByTestId('test-title')
    .should('have.text', 'App: Runs')
    .should('have.css', 'color', 'rgb(90, 95, 122)')

    cy.findByTestId('test-description')
    .should('have.text', 'should fetch newer runs and maintain them when navigating')
    .should('have.css', 'color', 'rgb(90, 95, 122)')
  })
})
