import { useMainStore } from '../store'
import SidebarNavigation from './SidebarNavigation.vue'

describe('SidebarNavigation', () => {
  it('renders something', () => {
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
  })
})
