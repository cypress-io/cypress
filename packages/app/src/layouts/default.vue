<template>
  <div class="h-screen min-w-728px grid grid-rows-[64px,1fr] grid-cols-[auto,1fr]">
    <SidebarNavigation
      v-if="renderSidebar"
      class="row-span-full"
    />

    <HeaderBar
      v-if="showHeader"
      :show-browsers="true"
      :page-name="currentRoute.name?.toString()"
      data-cy="app-header-bar"
      :allow-automatic-prompt-open="true"
    />

    <main
      aria-labelledby="primary-heading"
      class="overflow-auto"
    >
      <router-view v-slot="{ Component, route }">
        <h1
          id="primary-heading"
          class="sr-only"
        >
          {{ route.name }}
        </h1>
        <transition
          name="fade"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
  <div id="tooltip-target" />
</template>

<script lang="ts" setup>
import SidebarNavigation from '../navigation/SidebarNavigation.vue'
import HeaderBar from '@cy/gql-components/HeaderBar.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const currentRoute = useRoute()

const showHeader = computed(() => {
  return currentRoute.meta.header !== false
})

const renderSidebar = window.__CYPRESS_MODE__ !== 'run'
</script>
