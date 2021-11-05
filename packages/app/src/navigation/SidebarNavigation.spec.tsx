import { useMainStore } from '../store'
import SidebarNavigation from './SidebarNavigation.vue'

describe('SidebarNavigation', () => {
  it('expands the bar when clicking the expand button', () => {
    cy.mount(() => {
      const mainStore = useMainStore()

      return (
        <div>
          <div class={[mainStore.navBarExpanded ? 'w-248px' : 'w-64px', 'transition-all', 'h-screen']}>
            <SidebarNavigation />
          </div>
          <div id="tooltip-target"/>
        </div>
      )
    })

    cy.findByText('test-project').should('not.be.visible')
    cy.get('[aria-expanded]').click().should('have.attr', 'aria-expanded', 'true')
    cy.findByText('test-project').should('be.visible')
  })

  it('shows toolips on hover', () => {
    cy.mount(() => {
      return (
        <div>
          <div class="w-64px h-screen">
            <SidebarNavigation />
          </div>
          <div id="tooltip-target"/>
        </div>
      )
    })

    cy.get('[data-cy="sidebar-header"').trigger('mouseover', { force: true })
    cy.contains('#tooltip-target > div', 'test-project').should('be.visible')
    cy.get('[data-cy="sidebar-header"]').trigger('mouseout')

    cy.get('[tabindex]').trigger('mouseover', { force: true })
    cy.contains('#tooltip-target > div', 'E2E Testing').should('be.visible')
    cy.get('[tabindex]').trigger('mouseout')

    cy.get('[data-e2e-href="/runs"]').trigger('mouseover')
    cy.contains('#tooltip-target > div', 'Runs').should('be.visible')
    cy.get('[data-e2e-href="/runs"]').trigger('mouseout')
  })
})
