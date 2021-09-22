import SidebarNavigationRow from './SidebarNavigationRow.vue'

describe('SidebarNavigationRow', () => {
  it('renders something', () => {
    cy.mount(() => (<div class="space-y-20px">
      <h1 class="text-black text-xl truncate">Collapsed Navigation Rows</h1>
      <div class="w-64px bg-gray-900">

        <h1 class="text-white text-xl truncate">Example Navigation Rows</h1>
        <SidebarNavigationRow icon={BookIcon}/>
        <SidebarNavigationRow icon={BookIcon} selected/>
        <SidebarNavigationRow icon={BookIcon} selected active/>
      </div>
      <div
        class="resize-x overflow-auto space-y-4 p-4 h-500px bg-gray-900"
      >
        <h1 class="text-white text-xl truncate">Example Navigation Rows</h1>
        <SidebarNavigationRow icon={BookIcon}/>
        <SidebarNavigationRow icon={BookIcon} selected/>
        <SidebarNavigationRow icon={BookIcon} selected active/>
      </div></div>))
  })
})
