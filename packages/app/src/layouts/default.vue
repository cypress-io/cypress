<template>
  <div class="h-screen overflow-hidden flex flex-row">
    <main class="h-screen min-w-0 flex-1 border-t border-gray-200 lg:flex">
      <section
        aria-labelledby="primary-heading"
        class="min-w-0 flex-1 h-full flex flex-col overflow-hidden lg:order-last"
      >
        <HeaderBar
          v-if="showHeader"
          :show-browsers="true"
          :page-name="pageName"
        />
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
            <!-- <keep-alive> -->
            <component :is="Component" />
            <!-- </keep-alive> -->
          </transition>
        </router-view>
      </section>
    </main>
    <nav
      class="h-screen order-first"
      :class="mainStore.navBarExpanded ? 'w-240px' : 'w-80px'"
    >
      <SidebarNavigation class="h-full" />
    </nav>
  </div>
</template>

<script lang="ts" setup>
import SidebarNavigation from '../navigation/SidebarNavigation.vue'
import HeaderBar from '@cy/gql-components/HeaderBar.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useMainStore } from '../store'

const mainStore = useMainStore()
const currentRoute = useRoute()

const showHeader = computed(() => {
  return currentRoute.meta.header !== false
})

const pageName = computed((): string | undefined => {
  return currentRoute.meta?.title as string
})
</script>
