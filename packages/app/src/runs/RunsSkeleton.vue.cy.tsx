import RunsSkeleton from './RunsSkeleton.vue'

describe('<RunsSkeleton />', () => {
  it('displays git structure', () => {
    cy.mount(<RunsSkeleton isUsingGit />)

    cy.get(`[data-cy="runsSkeleton-git"`).should('be.visible')
  })

  it('displays default structure', () => {
    cy.mount(<RunsSkeleton />)

    cy.get(`[data-cy="runsSkeleton-default"`).should('be.visible')
  })
})
