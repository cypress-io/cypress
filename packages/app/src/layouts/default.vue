<template>
  <div
    class="h-screen min-w-[728px] grid grid-cols-[auto,1fr]"
    :class="{
      'grid-rows-[64px,1fr]': showHeader && !showEnableNotificationsBanner,
      'grid-rows-[144px,1fr]': showHeader && showEnableNotificationsBanner
      // 'grid-rows-[183px,1fr]' when < 900px width
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
      :show-enable-notifications-banner="showEnableNotificationsBanner"
    />
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
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery, useMutation, useSubscription } from '@urql/vue'
import HeaderBar from '@cy/gql-components/HeaderBar.vue'
import BaseError from '@cy/gql-components/error/BaseError.vue'
import Spinner from '@cy/components/Spinner.vue'

import { useRoute } from 'vue-router'
import { computed } from 'vue'

import { MainAppQueryDocument, MainApp_ResetErrorsAndLoadConfigDocument, Default_GlobalPreferencesChangeDocument } from '../generated/graphql'
import SidebarNavigationContainer from '../navigation/SidebarNavigationContainer.vue'
import { isRunMode } from '@packages/frontend-shared/src/utils/isRunMode'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import { dayjs } from '../runs/utils/day.js'

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
subscription Default_GlobalPreferencesChange {
  globalPreferencesChange {
    ...LocalSettingsNotifications
  }
}
`

useSubscription({ query: Default_GlobalPreferencesChangeDocument })

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
  return userProjectStatusStore.user.isLoggedIn &&
    userProjectStatusStore.project.isProjectConnected &&
    !userProjectStatusStore.project.hasNoRecordedRuns &&
    query.data.value?.localSettings.preferences.desktopNotificationsEnabled === null && (
    query.data.value?.localSettings.preferences.dismissNotificationBannerUntil ?
      dayjs().isAfter(dayjs(query.data.value?.localSettings.preferences.dismissNotificationBannerUntil)) : true)
})

const query = useQuery({
  query: MainAppQueryDocument,
  pause: !showHeader.value,
})
const mutation = useMutation(MainApp_ResetErrorsAndLoadConfigDocument)

const resetErrorAndLoadConfig = (id: string) => {
  if (!mutation.fetching.value) {
    mutation.executeMutation({ id })
  }
}

const renderSidebar = !isRunMode

</script>
