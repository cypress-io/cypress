<template>
  <div class="h-screen overflow-hidden flex flex-row">
    <main class="min-w-0 flex-1 border-t border-gray-200 lg:flex">
      <section
        aria-labelledby="primary-heading"
        class="min-w-0 flex-1 h-full flex flex-col overflow-hidden lg:order-last"
      >
        <HeaderBarContainer
          v-if="showHeader"
          :show-browsers="true"
          :page-name="currentRoute.name"
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
        <ModalManager v-if="modalStore.activeModalId" />
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
import HeaderBarContainer from '../../../frontend-shared/src/gql-components/HeaderBarContainer.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

import ModalManager from '../modals/ModalManager.vue'
import { useModalStore, useMainStore } from '../store'

const modalStore = useModalStore()
const mainStore = useMainStore()
const currentRoute = useRoute()

const showHeader = computed(() => {
  // if there's more than one place in the app that will not have a header,
  // this can get more formal
  return currentRoute.name !== 'Spec'
})
</script>
