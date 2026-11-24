import SidebarNavigationRow from './SidebarNavigationRow.vue'
import {
  IconStatusFailedOutline,
  IconTechnologyCodeEditor,
  IconTechnologyTestResults,
  IconObjectGear,
  IconGeneralPlaceholder,
} from '@cypress-design/vue-icon'

describe('SidebarNavigationRow', () => {
  it('renders something', () => {
    cy.mount(() => (<div>
      <div
        class="space-y-4 bg-gray-900 h-[500px] w-[256px] resize-x overflow-auto"
      >
        <h2 class="text-white text-sm uppercase truncate">Tab Style</h2>
        <SidebarNavigationRow icon={IconTechnologyCodeEditor} name="book" active isNavBarExpanded/>
        <SidebarNavigationRow icon={IconStatusFailedOutline} name="debug" isNavBarExpanded/>
        <SidebarNavigationRow icon={IconTechnologyTestResults} name="settings" isNavBarExpanded/>
        <SidebarNavigationRow icon={IconObjectGear} name="test-results" isNavBarExpanded/>
        <SidebarNavigationRow icon={IconGeneralPlaceholder} name="placeholder" isNavBarExpanded/>
      </div>
    </div>))
  })
})
