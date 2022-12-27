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

  it('passes utm parameter to slot', () => {
    cy.mount(() => (
      <SpecsListRowItem
        isLeaf={true}
        route={{ path: '/specs/runner', query: { file: '' } }}
        gridColumns="grid-cols-[1fr,1fr]"
        is-project-connected={false}
        // @ts-ignore - doesn't know about vSlots
        vSlots={{
          'latest-runs': () => <span data-cy='latest'>Runs</span>,
          'average-duration': () => <span data-cy='duration'>Duration</span>,
          'connect-button': (props) => <span data-cy='button'>{props.utmMedium}</span>,
        }}
      />))

    cy.findByTestId('latest').trigger('mouseenter').wait(300)
    cy.findByTestId('button').contains('Specs Latest Runs Empty State')
    cy.findByTestId('button').trigger('mouseleave')

    cy.findByTestId('duration').trigger('mouseenter').wait(300)
    cy.findByTestId('button').contains('Specs Average Duration Empty State')
    cy.findByTestId('button').trigger('mouseleave')
  })
})
