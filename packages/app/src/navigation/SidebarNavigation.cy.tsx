import SidebarNavigation from './SidebarNavigation.vue'
import { defaultMessages } from '@cy/i18n'

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

    cy.findByText('test-project').should('not.be.visible')
    cy.findByLabelText(defaultMessages.sidebar.toggleLabel.collapsed, {
      selector: 'button',
    }).click()

    cy.findByLabelText(defaultMessages.sidebar.toggleLabel.expanded, {
      selector: 'button',
    })

    cy.findByText('test-project').should('be.visible')

    cy.percySnapshot()
  })

  it('shows tooltips on hover', () => {
    mountComponent(false)
    cy.findByTestId('sidebar-header').trigger('mouseenter')
    cy.contains('.v-popper--some-open--tooltip', 'test-project').should('be.visible')
    cy.findByTestId('sidebar-header').trigger('mouseout')

    cy.findByTestId('sidebar-link-runs-page').trigger('mouseenter')
    cy.contains('.v-popper--some-open--tooltip', 'Runs').should('be.visible')
    cy.findByTestId('sidebar-link-runs-page').trigger('mouseout')
    cy.percySnapshot()
  })

  it('opens a modal to switch testing type', { viewportWidth: 1280 }, () => {
    mountComponent()
    cy.findByTestId('sidebar-header').click()
    cy.percySnapshot()
  })

  it('opens a modal to show keyboard shortcuts', () => {
    mountComponent()
    cy.findByTestId('keyboard-modal').should('not.exist')
    cy.findByTestId('keyboard-modal-trigger').focus().type('{enter}')
    cy.findByTestId('keyboard-modal').should('be.visible')
  })

  it('uses exact match for router link active class', () => {
    mountComponent()
    cy.findByTestId('sidebar-link-specs-page').should('have.class', 'router-link-exact-active')
  })
})
