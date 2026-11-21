import NoResults from './NoResults.vue'

describe('<NoResults />', () => {
  it('renders if there is a search message', () => {
    const testSearch = 'test search'
    const clearSpy = cy.spy().as('clearSpy')

    cy.mount(() => (
      <div><NoResults onClear={clearSpy} searchTerm={testSearch} /></div>
    ))

    cy.contains(testSearch).should('be.visible')
    cy.contains('No results matched your search:').should('be.visible')
    cy.contains('button', 'Clear search').should('be.visible')
    .click()
    .get('@clearSpy')
    .should('have.been.calledOnce')
  })

  it('does not render if there is no search message', () => {
    cy.mount(() => (
      <div><NoResults /></div>
    ))

    cy.contains('No results matched your search:').should('not.exist')
    cy.contains('button', 'Clear search').should('not.exist')
  })
})
