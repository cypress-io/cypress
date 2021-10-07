<template>
  <div class="flex flex-col flex-1 min-h-0 bg-gray-1000">
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
        <router-link
          v-for="item in navigation"
          v-slot="{ href, isActive }"
          :key="item.name"
          custom
          :to="item.href"
        >
          <SidebarNavigationRow
            :active="isActive"
            :icon="item.icon"
            :href="href"
          >
            {{ item.name }}
          </SidebarNavigationRow>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script lang="ts" setup>
import SidebarNavigationRow from './SidebarNavigationRow.vue'
import { defineProps } from 'vue'
import SpecsIcon from '~icons/cy/test-results_x24'
import CodeIcon from '~icons/cy/code-editor_x24'
import SettingsIcon from '~icons/cy/settings_x24'

const navigation = [
  { name: 'Specs', icon: SpecsIcon, href: '/' },
  { name: 'Runs', icon: CodeIcon, href: '/runs' },
  { name: 'Settings', icon: SettingsIcon, href: '/settings' },
]

defineProps<{
  expanded?: boolean
}>()
</script>
