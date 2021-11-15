<template>
  <div class="h-screen layout-grid">
    <SidebarNavigation class="row-span-full" />

    <HeaderBar
      v-if="showHeader"
      :show-browsers="true"
      :page-name="pageName"
    />

    <main
      class="overflow-y-auto"
      aria-labelledby="primary-heading"
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

const pageName = computed((): string | undefined => {
  return currentRoute.meta?.title as string
})
</script>

<style lang="scss" scoped>
.layout-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 64px 1fr;
}
</style>
