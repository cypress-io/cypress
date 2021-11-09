<template>
  <HideDuringScreenshot class="flex relative flex-col flex-1 h-full bg-gray-1000">
    <div
      class="absolute cursor-pointer w-16px bottom-0 top-0 left-full group"
      :aria-expanded="mainStore.navBarExpanded"
      @click="mainStore.toggleNavBar"
    >
      <div class="w-16px origin-left transform scale-x-0 group-hover:scale-x-100 h-full transition-transform duration-300 flex items-center">
        <div class="h-full w-3px bg-indigo-400" />
        <i-cy-chevron-right_x16
          class="icon-dark-indigo-400 h-16px w-16px"
          :class="mainStore.navBarExpanded ? 'transform rotate-180': ''"
        />
      </div>
    </div>
    <div class="flex flex-col flex-1 overflow-y-auto ">
      <SidebarTooltip
        class="flex items-center h-64px"
        :disabled="mainStore.navBarExpanded"
        :popper-top-offset="4"
        popper-class="h-56px"
        data-cy="sidebar-header"
      >
        <i-cy-bookmark_x24
          class="icon-dark-gray-200
          icon-light-gray-900
          w-24px
          h-24px
          flex-shrink-0 mx-20px"
        />
        <div class="text-gray-50 truncate leading-24px text-size-16px">
          {{ query.data.value?.currentProject?.title ?? 'Cypress' }}
          <p class="text-gray-600 truncate leading-20px text-size-14px">
            chore/use-import-types-for-gql
          </p>
        </div>

        <template #popper>
          <div class="text-left text-gray-50 truncate leading-16px text-size-16px">
            {{ query.data.value?.currentProject?.title ?? 'Cypress' }}
            <p class="text-gray-600 truncate leading-20px text-size-14px">
              chore/use-import-types-for-gql
            </p>
          </div>
        </template>
      </SidebarTooltip>

      <hr class="border-gray-900">
      <nav
        class="flex-1 space-y-1 bg-gray-1000"
        aria-label="Sidebar"
      >
        <SwitchTestingTypeButton
          v-if="query.data.value"
          :gql="query.data.value"
        />
        <RouterLink
          v-for="item in navigation"
          v-slot="{ isActive }"
          :key="item.name"
          :to="item.href"
        >
          <SidebarNavigationRow
            :data-e2e-href="item.href"
            :active="isActive"
            :icon="item.icon"
            :name="item.name"
          />
        </RouterLink>
      </nav>
      <img
        :src="CypressLogo"
        class="w-32px h-32px m-16px"
      >
    </div>
  </HideDuringScreenshot>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import SidebarNavigationRow from './SidebarNavigationRow.vue'
import SwitchTestingTypeButton from './SwitchTestingTypeButton.vue'
import CodeIcon from '~icons/cy/code-editor_x24'
import RunsIcon from '~icons/cy/runs_x24'
import SettingsIcon from '~icons/cy/settings_x24'
import SidebarTooltip from './SidebarTooltip.vue'
import { useMainStore } from '../store'
import { SideBarNavigationDocument } from '../generated/graphql'
import CypressLogo from '@packages/frontend-shared/src/assets/logos/cypress_s.png'
import HideDuringScreenshot from '../runner/screenshot/HideDuringScreenshot.vue'

const navigation = [
  { name: 'Home', icon: CodeIcon, href: '/' },
  { name: 'Runs', icon: RunsIcon, href: '/runs' },
  { name: 'Settings', icon: SettingsIcon, href: '/settings' },
]

gql`
query sideBarNavigation {
  ...SwitchTestingTypeButton
  currentProject {
    id
    title
  }
}
`

const query = useQuery({ query: SideBarNavigationDocument })

const mainStore = useMainStore()

</script>
