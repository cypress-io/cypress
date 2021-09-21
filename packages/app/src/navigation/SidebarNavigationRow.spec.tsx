import SidebarNavigationRow from './SidebarNavigationRow.vue'
import SettingsIcon from 'virtual:vite-icons/mdi/settings'
import HeartIcon from 'virtual:vite-icons/mdi/heart'
import BookmarkIcon from 'virtual:vite-icons/bi/bookmark-star'

describe('SidebarNavigationRow', () => {
  it('renders something', () => {
    cy.mount(() => (<div
      class="resize-x overflow-auto space-y-4 p-4 h-500px bg-gray-900"
    >
      <h1 class="text-white text-xl truncate">Example Navigation Rows</h1>
      <h2 class="text-white text-sm uppercase truncate">Row Style (default)</h2>
      <SidebarNavigationRow icon={SettingsIcon}/>
      <SidebarNavigationRow icon={HeartIcon} selected/>
      <SidebarNavigationRow icon={BookmarkIcon} selected active/>
      <h2 class="text-white text-sm uppercase truncate">Tab Style</h2>
      <SidebarNavigationRow icon={SettingsIcon} style="tab"/>
      <SidebarNavigationRow icon={HeartIcon} style="tab" selected/>
      <SidebarNavigationRow icon={BookmarkIcon} style="tab" selected active/>
    </div>))
  })
})
