import SidebarNavigation from './SidebarNavigation.vue'

function mountComponent (initialNavExpandedVal = true) {
  cy.mount(() => {
    return (
      <div>
        <div class={[initialNavExpandedVal ? 'w-248px' : 'w-64px', 'transition-all', 'h-screen', 'grid', 'grid-rows-1']}>
          <SidebarNavigation />
        </div>
      </div>
    )
  })
}

describe('SidebarNavigation', () => {
  it('expands the bar when clicking the expand button', () => {
    mountComponent()

    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'false')
    cy.findByText('test-project').should('not.be.visible')
    cy.findByLabelText('toggle navigation', {
      selector: 'button',
    }).click()

    cy.get('[aria-expanded]').should('have.attr', 'aria-expanded', 'true')
    cy.findByText('test-project').should('be.visible')
  })

  it('shows tooltips on hover', () => {
    mountComponent(false)
    cy.get('[data-cy="sidebar-header"').trigger('mouseenter')
    cy.contains('.v-popper--some-open--tooltip', 'test-project').should('be.visible')
    cy.get('[data-cy="sidebar-header"]').trigger('mouseout')

    cy.get('[data-e2e-href="/runs"]').trigger('mouseenter')
    cy.contains('.v-popper--some-open--tooltip', 'Runs').should('be.visible')
    cy.get('[data-e2e-href="/runs"]').trigger('mouseout')
  })

  it('opens a modal to switch testing type', { viewportWidth: 1280 }, () => {
    mountComponent()
    cy.get('[data-cy="sidebar-header"]').click()
  })
})
