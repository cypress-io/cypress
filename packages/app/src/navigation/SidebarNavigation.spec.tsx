import { useMainStore } from '../store'
import SidebarNavigation from './SidebarNavigation.vue'

describe('SidebarNavigation', () => {
  it('renders something', () => {
    cy.mount(() => {
      const mainStore = useMainStore()

      return (<div class={mainStore.navBarExpanded ? 'w-248px' : 'w-64px'}>
        <SidebarNavigation />
      </div>)
    })
  })
})
