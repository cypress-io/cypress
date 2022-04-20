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
    <BaseError
      v-if="query.data.value?.baseError"
      :gql="query.data.value?.baseError"
      :retry="resetErrorsAndLoadConfig"
      class="h-full w-full top-0 left-0 absolute overflow-scroll"
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
</template>

<script lang="ts" setup>
import { gql, useQuery, useMutation } from '@urql/vue'
import SidebarNavigation from '../navigation/SidebarNavigation.vue'
import HeaderBar from '@cy/gql-components/HeaderBar.vue'
import BaseError from '@cy/gql-components/error/BaseError.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

import { MainAppQueryDataDocument, Main_ResetErrorsAndLoadConfigDocument } from '../generated/graphql'

gql`
query MainAppQueryData {
    baseError {
    ...BaseError
  }
}`

const query = useQuery({ query: MainAppQueryDataDocument })
const mutation = useMutation(Main_ResetErrorsAndLoadConfigDocument)

const resetErrorsAndLoadConfig = () => {
  if (!mutation.fetching.value) {
    mutation.executeMutation({})
  }
}

const currentRoute = useRoute()

const showHeader = computed(() => {
  return currentRoute.meta.header !== false
})

const renderSidebar = window.__CYPRESS_MODE__ !== 'run'
</script>
