import SidebarNavigationRow from './SidebarNavigationRow.vue'
import BookIcon from '~icons/cy/book_x24'
import SettingsIcon from '~icons/cy/settings_x24'
import TestResultsIcon from '~icons/cy/test-results_x24'
import PlaceholderIcon from '~icons/cy/placeholder_x24'

describe('SidebarNavigationRow', () => {
  it('renders something', () => {
    cy.mount(() => (<div
      class="resize-x overflow-auto space-y-4 p-4 h-500px bg-gray-900"
    >
      <h2 class="text-white text-sm uppercase truncate">Tab Style</h2>
      <SidebarNavigationRow icon={BookIcon} active/>
      <SidebarNavigationRow icon={SettingsIcon} />
      <SidebarNavigationRow icon={TestResultsIcon} />
      <SidebarNavigationRow icon={PlaceholderIcon} />
    </div>))
  })
})
