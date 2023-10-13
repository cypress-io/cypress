import RunTag from './RunTag.vue'

describe('<RunTag />', () => {
  it('should show a normal tag', () => {
    cy.mount({
      name: 'RunTag',
      render () {
        return (
          <RunTag
            label="test-label"
          />
        )
      },
    })

    cy.get(`[data-cy="runTag"`).should('be.visible').contains('test-label')
  })

  it('should show a icon tag', () => {
    cy.mount({
      name: 'RunTag',
      render () {
        return (
          <RunTag
            label="test-label"
            icon={<span data-cy="test-dummy-icon">z</span>}
            iconLabel="test-sr-text"
          />
        )
      },
    })

    cy.get(`[data-cy="runTag"`).should('be.visible').contains('test-label')
    cy.get(`[data-cy="runTag"`).should('be.visible').contains('test-sr-text')
    cy.get(`[data-cy="runTag"`).should('be.visible').contains('z')
  })
})
