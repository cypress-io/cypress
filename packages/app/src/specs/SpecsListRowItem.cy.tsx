import SpecsListRowItem from './SpecsListRowItem.vue'

describe('SpecItem', () => {
  it('renders a SpecsListRowItem as leaf', () => {
    const toggleRowHandler = cy.stub()

    cy.mount(() => (
      <SpecsListRowItem
        isLeaf={true}
        route={{ path: '/specs/runner', query: { file: '' } }}
        gridColumns="grid-cols-[1fr,1fr]"
        onToggleRow={toggleRowHandler}
        // @ts-ignore - doesn't know about vSlots
        vSlots={{
          file: () => <span>File Name</span>,
          'git-info': () => <span>Git Info</span>,
        }}
      />))

    // Clicking directly on file name section should trigger row
    cy.get('[data-cy="specs-list-row-file"]').click()
    cy.wrap(toggleRowHandler).should('have.callCount', 1)

    // Clicking directory on git info section should trigger row
    cy.get('[data-cy="specs-list-row-git-info"]').click()
    cy.wrap(toggleRowHandler).should('have.callCount', 2)

    // Clicking elsewhere on row should trigger row
    cy.get('[data-cy="spec-item-link"]').click('right')
    cy.wrap(toggleRowHandler).should('have.callCount', 3)
  })

  it('renders a SpecsListRowItem as non-leaf', () => {
    const toggleRowHandler = cy.stub()

    cy.mount(() => (
      <SpecsListRowItem
        isLeaf={false}
        gridColumns="grid-cols-[1fr]"
        onToggleRow={toggleRowHandler}
        // @ts-ignore - doesn't know about vSlots
        vSlots={{
          file: () => <span>Directory Name</span>,
        }}
      />))

    // Clicking directly on file name section should trigger row
    cy.get('[data-cy="specs-list-row-file"]').click()
    cy.wrap(toggleRowHandler).should('have.callCount', 1)

    // Clicking elsewhere on row should trigger row
    cy.get('[data-cy="spec-item-directory"]').click('right')
    cy.wrap(toggleRowHandler).should('have.callCount', 2)
  })
})
