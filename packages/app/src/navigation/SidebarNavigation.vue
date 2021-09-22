<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <div class="flex-1 flex flex-col min-h-0 bg-gray-800">
    <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div class="flex items-center flex-shrink-0 px-4">
        <i-bi-bookmark-star class="text-white w-18px h-18px"/>
      </div>
      <nav class="mt-5 flex-1 px-2 bg-gray-800 space-y-1" aria-label="Sidebar">
        <router-link custom v-slot="{ href, isActive }" v-for="item in navigation" :key="item.name" :to="item.href">
          <SidebarNavigationRow :active="isActive" :icon="item.icon" :href="href">
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
import ListIcon from 'virtual:vite-icons/mdi/view-list'
import CodeIcon from 'virtual:vite-icons/mdi/code-array'
import SettingsIcon from 'virtual:vite-icons/mdi/cog'

// const random = Math.random()
const navigation = [
  { name: 'Specs', icon: ListIcon, href: '/' },
  { name: 'Runs', icon: CodeIcon, href: '/runs' },
  { name: 'Settings', icon: SettingsIcon, href: '/settings' }
]

defineProps<{
  expanded?: boolean
}>()

</script>
