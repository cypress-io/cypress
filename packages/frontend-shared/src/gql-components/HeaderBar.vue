<template>
  <div
    class="px-6 py-15px border-b border-b-gray-100 mb-24px"
    data-testid="header-bar"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <img
          class="mr-18px w-32px h-32px"
          src="../assets/logos/cypress-dark.png"
        >
        <a
          :class="query?.app?.activeProject ? 'text-indigo-500' :
            'text-gray-700'"
          :href="query?.app?.activeProject ? 'global-mode' : undefined"
          @click.prevent="clearActiveProject"
        >Projects</a>
        <!-- TODO: Replace with a cy icon -->
        <i-oi-chevron-right
          v-if="query?.app?.activeProject"
          class="text-gray-300 h-8px"
        />
        <span class="text-body-gray-700">{{ query?.app?.activeProject?.title }}</span>
      </div>
      <div class="flex gap-6">
        <TopNav
          :gql="query.app"
          :show-browsers="props.showBrowsers"
        >
          <template
            v-if="!!query.cloudViewer"
            #login-title
          >
            <UserAvatar
              :email="email"
              class="w-24px h-24px"
            />
            <span class="sr-only">{{ t('topNav.login.actionLogin') }}</span>
          </template>
          <template
            v-if="!!query.cloudViewer"
            #login-panel
          >
            <div class="min-w-248px">
              <div class="flex border-b-gray-100 border-b p-16px">
                <UserAvatar
                  :email="email"
                  class="w-48px mr-16px h-48px"
                />
                <div>
                  <span class="text-gray-800">{{ query.cloudViewer?.fullName }}</span>
                  <br>
                  <span class="text-gray-600">{{ query.cloudViewer?.email }}</span>
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
                  :gql="query"
                  :show-logout="true"
                />
              </div>
            </div>
          </template>
        </TopNav>
        <div>
          <button
            v-if="!query.cloudViewer"
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
        :gql="query"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql, useMutation, useQuery } from '@urql/vue'
import { ref, computed } from 'vue'
import { GlobalPageHeader_ClearActiveProjectDocument, HeaderBar_HeaderBarQueryDocument } from '../generated/graphql'
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
query HeaderBar_HeaderBarQuery {
  app {
    activeProject {
      id
      title
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

const props = defineProps<{
  showBrowsers?: Boolean
}>()

const { t } = useI18n()

const headerBarQuery = useQuery({ query: HeaderBar_HeaderBarQueryDocument })
const query = computed(() => {
  return headerBarQuery.data?.value
})
</script>
