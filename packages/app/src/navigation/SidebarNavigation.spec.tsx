import SidebarNavigation from './SidebarNavigation.vue'

describe('SidebarNavigation', () => {
  it('renders something', () => {
    cy.mount(() => (<div class="w-256px">
      <SidebarNavigation/>
    </div>))
  })
})
