<template>
  <div
    class="h-screen min-w-[728px] grid grid-cols-[auto,1fr]"
    :class="{
      'grid-rows-[auto,1fr]': showHeader,
    }"
  >
    <SidebarNavigationContainer
      v-if="renderSidebar"
      class="row-span-full"
    />
    <HeaderBar
      v-if="showHeader"
      :show-browsers="true"
      :page-name="currentRoute.name?.toString()"
      data-cy="app-header-bar"
      :allow-automatic-prompt-open="true"
    >
      <template #banner>
        <EnableNotificationsBanner
          v-if="showEnableNotificationsBanner"
        />
      </template>
    </HeaderBar>
    <div
      v-if="query.data.value?.baseError || query.data.value?.currentProject?.isLoadingConfigFile || query.data.value?.currentProject?.isLoadingNodeEvents"
      class="bg-white h-full w-full pt-[100px] top-0 right-0 left-0 z-10 absolute overflow-scroll"
    >
      <BaseError
        v-if="query.data.value?.baseError"
        :gql="query.data.value.baseError"
        @retry="resetErrorAndLoadConfig"
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
          <component
            :is="Component"
          />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery, useMutation } from '@urql/vue'
import HeaderBar from '@cy/gql-components/HeaderBar.vue'
import BaseError from '@cy/gql-components/error/BaseError.vue'
import Spinner from '@cy/components/Spinner.vue'

import { useRoute } from 'vue-router'
import { computed } from 'vue'

import { MainAppQueryDocument, MainApp_ResetErrorsAndLoadConfigDocument } from '../generated/graphql'
import SidebarNavigationContainer from '../navigation/SidebarNavigationContainer.vue'
import { isRunMode } from '@packages/frontend-shared/src/utils/isRunMode'
import { isWindows } from '@packages/frontend-shared/src/utils/isWindows'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import EnableNotificationsBanner from '../specs/banners/EnableNotificationsBanner.vue'

const userProjectStatusStore = useUserProjectStatusStore()

gql`
fragment LocalSettingsNotifications on LocalSettings {
    preferences {
      desktopNotificationsEnabled
      dismissNotificationBannerUntil
    }
}
`

gql`
fragment MainAppQueryData on Query {
    baseError {
      id
      ...BaseError
    }
    currentProject {
      id
      isLoadingConfigFile
      isLoadingNodeEvents
    }
    localSettings {
      ...LocalSettingsNotifications
  }
}
`

gql`
query MainAppQuery {
  ...MainAppQueryData
}
`

gql`
mutation MainApp_ResetErrorsAndLoadConfig($id: ID!) {
  resetErrorAndLoadConfig(id: $id) {
    ...MainAppQueryData
  }
}
`

const currentRoute = useRoute()

const showHeader = computed(() => {
  return currentRoute.meta.header !== false
})

const showEnableNotificationsBanner = computed(() => {
  // Run notifications will initially be released without support for Windows
  // https://github.com/cypress-io/cypress/issues/26786
  return !isWindows &&
    userProjectStatusStore.cloudStatus === 'allTasksCompleted' &&
    query.data.value?.localSettings.preferences.desktopNotificationsEnabled === null && (
    query.data.value?.localSettings.preferences.dismissNotificationBannerUntil ?
      Date.now() > new Date(query.data.value?.localSettings.preferences.dismissNotificationBannerUntil).getTime() : true)
})

const query = useQuery({
  query: MainAppQueryDocument,
  pause: isRunMode,
})

const mutation = useMutation(MainApp_ResetErrorsAndLoadConfigDocument)

const resetErrorAndLoadConfig = (id: string) => {
  if (!mutation.fetching.value) {
    mutation.executeMutation({ id })
  }
}

const renderSidebar = computed(() => {
  if (currentRoute.name === 'Specs' && query.data.value) {
    return !isRunMode && query.data.value?.currentProject?.isLoadingConfigFile === false
  }

  return !isRunMode
})

</script>
