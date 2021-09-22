<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <div class="flex-1 flex flex-col min-h-0 bg-gray-800">
    <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div class="flex items-center flex-shrink-0 px-4">
        <i-bi-bookmark-star class="text-white w-18px h-18px"/>
      </div>
      <nav class="mt-5 flex-1 px-2 bg-gray-800 space-y-1" aria-label="Sidebar">
        <router-link custom v-slot="{ href, route, isActive, isExactActive }" v-for="item in navigation" :key="item.name" :to="item.href">
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
import BookmarkIcon from 'virtual:vite-icons/bi/bookmark-star'

const navigation = [
  { name: 'Foo', icon: BookmarkIcon, href: '/foo', current: true },
  { name: 'Bar', icon: BookmarkIcon, href: '/bar', count: 3, current: false },
  { name: 'Home', icon: BookmarkIcon, href: '/', count: 4, current: false },
  { name: 'Calendar', icon: BookmarkIcon, href: '/calendar', current: false },
  { name: 'Documents', icon: BookmarkIcon, href: '/documents', current: false },
  { name: 'Reports', icon: BookmarkIcon, href: '/reports', count: 12, current: false },
]

defineProps<{
  expanded?: boolean
}>()

</script>
