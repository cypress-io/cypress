<template>
  <div class="flex relative flex-col flex-1 min-h-0 bg-gray-1000">
    <div
      class="absolute cursor-pointer bg-gray-800 w-2px hover:w-8px bottom-0 top-0 right-0 hover:bg-indigo-300"
      @click="mainStore.toggleNavBar"
    />
    <div class="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
      <div class="flex items-center flex-shrink-0 px-4">
        <i-cy-bookmark_x24
          class="icon-dark-gray-200
          icon-light-gray-900
          w-24px
          h-24px"
        />
        <i-bi-bookmark-star class="text-white w-18px h-18px" />
      </div>
      <nav
        class="flex-1 px-2 mt-5 space-y-1 bg-gray-1000"
        aria-label="Sidebar"
      >
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
          >
            {{ item.name }}
          </SidebarNavigationRow>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<script lang="ts" setup>
import SidebarNavigationRow from './SidebarNavigationRow.vue'
import SpecsIcon from '~icons/cy/test-results_x24'
import CodeIcon from '~icons/cy/code-editor_x24'
import RunsIcon from '~icons/cy/runs_x24'
import SettingsIcon from '~icons/cy/settings_x24'
import { useMainStore } from '../store'

const navigation = [
  { name: 'Home', icon: SpecsIcon, href: '/' },
  { name: 'Specs', icon: CodeIcon, href: '/specs' },
  { name: 'Runs', icon: RunsIcon, href: '/runs' },
  { name: 'Settings', icon: SettingsIcon, href: '/settings' },
  { name: 'New Spec', icon: SettingsIcon, href: '/newspec' },
]

const mainStore = useMainStore()
</script>
