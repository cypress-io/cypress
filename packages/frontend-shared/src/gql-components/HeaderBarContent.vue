<template>
  <div
    class="px-6 py-15px border-b border-b-gray-100 bg-white"
    data-testid="header-bar"
  >
    <div class="flex items-center justify-between">
      <div v-if="pageName">
        {{ pageName }}
      </div>
      <div
        v-else
        class="flex items-center"
      >
        <img
          class="mr-18px w-32px h-32px"
          src="../assets/logos/cypress-dark.png"
        >
        <a
          :class="props.gql?.app?.activeProject ? 'text-indigo-500' :
            'text-gray-700'"
          :href="props.gql?.app?.activeProject ? 'global-mode' : undefined"
          @click.prevent="clearActiveProject"
        >Projects</a>
        <!-- TODO: Replace with a cy icon -->
        <i-oi-chevron-right
          v-if="props.gql?.app?.activeProject"
          class="text-gray-300 h-8px"
        />
        <span class="text-body-gray-700">{{ props.gql?.app?.activeProject?.title }}</span>
      </div>
      <div class="flex gap-6">
        <TopNav
          :gql="props.gql?.app"
          :show-browsers="props.showBrowsers"
        >
          <template
            v-if="!!props.gql?.cloudViewer"
            #login-title
          >
            <UserAvatar
              :email="email"
              class="w-24px h-24px"
            />
            <span class="sr-only">{{ t('topNav.login.actionLogin') }}</span>
          </template>
          <template
            v-if="!!props.gql?.cloudViewer"
            #login-panel
          >
            <div class="min-w-248px">
              <div class="flex border-b-gray-100 border-b p-16px">
                <UserAvatar
                  :email="email"
                  class="w-48px mr-16px h-48px"
                />
                <div>
                  <span class="text-gray-800">{{ props.gql?.cloudViewer?.fullName }}</span>
                  <br>
                  <span class="text-gray-600">{{ props.gql?.cloudViewer?.email }}</span>
                  <br>
                  <a
                    class="text-indigo-500 hocus-link-default"
                    href="https://on.cypress.io/dashboard/profile"
                    target="_blank"
                  >Profile Settings</a>
                </div>
              </div>

              <div class="p-16px">
                <Auth
                  :gql="props.gql"
                  :show-logout="true"
                />
              </div>
            </div>
          </template>
        </TopNav>
        <div>
          <button
            v-if="!props.gql?.cloudViewer"
            class="flex group items-center text-gray-600 focus:outline-transparent"
            @click="openLogin"
          >
            <i-cy-profile_x16
              class="block icon-dark-gray-500 icon-light-gray-100 group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50 h-16px w-16px mr-8px"
            />
            <span class="group-hocus:text-indigo-500">{{ t('topNav.login.actionLogin') }}</span>
          </button>
        </div>
      </div>
      <LoginModal
        v-model="isLoginOpen"
        :gql="props.gql"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql, useMutation } from '@urql/vue'
import { ref, computed } from 'vue'
import { GlobalPageHeader_ClearActiveProjectDocument, HeaderBar_HeaderBarContentFragment } from '../generated/graphql'
import TopNav from './topnav/TopNav.vue'
import LoginModal from './topnav/LoginModal.vue'
import UserAvatar from './topnav/UserAvatar.vue'
import Auth from './Auth.vue'
import { useI18n } from '@cy/i18n'

gql`
mutation GlobalPageHeader_clearActiveProject {
  clearActiveProject
}
`

gql`
fragment HeaderBar_HeaderBarContent on Query {
  app {
    activeProject {
      id
      title
      config
      savedState
    }
    ...TopNav
  }
  ...Auth
}
`

const isLoginOpen = ref(false)
const clearActiveProjectMutation = useMutation(GlobalPageHeader_ClearActiveProjectDocument)
const email = computed(() => props.gql.cloudViewer?.email || undefined)

const openLogin = () => {
  isLoginOpen.value = true
}

const clearActiveProject = () => {
  if (props.gql.app.activeProject) {
    clearActiveProjectMutation.executeMutation({})
  }
}

const promptState = computed(() => {
  return props.gql?.app?.activeProject?.savedState
})

const props = defineProps<{
  gql: HeaderBar_HeaderBarContentFragment,
  showBrowsers?: boolean,
  pageName?: string
}>()

const { t } = useI18n()

</script>
