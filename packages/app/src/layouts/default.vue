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
    <div
      v-if="query.data.value?.baseError || query.data.value?.currentProject?.isLoadingConfigFile || query.data.value?.currentProject?.isLoadingNodeEvents"
      class="bg-white h-full w-full pt-100px top-0 right-0 left-0 z-10 absolute overflow-scroll"
    >
      <BaseError
        v-if="query.data.value?.baseError"
        :gql="query.data.value?.baseError"
        :retry="resetErrorsAndLoadConfig"
      />
      <div v-else>
        <Spinner />
      </div>
    </div>
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
import { gql, useQuery, useMutation, useSubscription } from '@urql/vue'
import SidebarNavigation from '../navigation/SidebarNavigation.vue'

import HeaderBar from '@cy/gql-components/HeaderBar.vue'
import BaseError from '@cy/gql-components/error/BaseError.vue'
import Spinner from '@cy/components/Spinner.vue'

import { useRoute } from 'vue-router'
import { computed } from 'vue'

import { MainAppQueryDocument, MainApp_ResetErrorsAndLoadConfigDocument, CheckBaseErrorDocument } from '../generated/graphql'

gql`
fragment MainAppQueryData on Query {
    baseError {
      ...BaseError
    }
    currentProject {
      id
      isLoadingConfigFile
      isLoadingNodeEvents
    }
}
`

gql`
query MainAppQuery {
  ...MainAppQueryData
}
`

gql`
mutation MainApp_ResetErrorsAndLoadConfig {
  resetErrorsAndLoadConfig {
    ...MainAppQueryData
  }
}
`

gql`
subscription CheckBaseError {
  baseErrorChange {
    ...MainAppQueryData
  }
}
`

useSubscription({ query: CheckBaseErrorDocument })

const query = useQuery({ query: MainAppQueryDocument })
const mutation = useMutation(MainApp_ResetErrorsAndLoadConfigDocument)

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
