<template>
  <div class="bg-white border-b border-b-gray-100 py-15px px-6">
    <div class="flex h-full gap-12px items-center justify-between">
      <div v-if="pageName">
        {{ pageName }}
      </div>
      <div
        v-else
        class="flex items-center"
      >
        <img
          class="h-32px mr-18px w-32px"
          src="../assets/logos/cypress-dark.png"
        >
        <a
          :class="props.gql?.currentProject ? 'text-indigo-500' :
            'text-gray-700'"
          :href="props.gql?.currentProject ? 'global-mode' : undefined"
          @click.prevent="clearActiveProject"
        >
          Projects
        </a>
        <!-- TODO: Replace with a cy icon -->
        <i-oi-chevron-right
          v-if="props.gql?.currentProject"
          class="h-8px text-gray-300"
        />
        <span class="text-body-gray-700">{{ props.gql?.currentProject?.title }}</span>
      </div>
      <div class="flex gap-6">
        <TopNav
          :gql="props.gql"
          :show-browsers="props.showBrowsers"
        >
          <template
            v-if="!!props.gql?.cloudViewer"
            #login-title
          >
            <UserAvatar
              :email="email"
              class="h-24px w-24px"
            />
            <span class="sr-only">{{ t('topNav.login.actionLogin') }}</span>
          </template>
          <template
            v-if="!!props.gql?.cloudViewer"
            #login-panel
          >
            <div
              class="min-w-248px"
              data-cy="login-panel"
            >
              <div class="border-b flex border-b-gray-100 p-16px">
                <UserAvatar
                  :email="email"
                  class="h-48px mr-16px w-48px"
                />
                <div>
                  <span class="text-gray-800">{{ props.gql?.cloudViewer?.fullName }}</span>
                  <br>
                  <span class="text-gray-600">{{ props.gql?.cloudViewer?.email }}</span>
                  <br>
                  <ExternalLink
                    href="https://on.cypress.io/dashboard/profile"
                  >
                    Profile Settings
                  </ExternalLink>
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
            class="flex text-gray-600 group items-center focus:outline-transparent"
            @click="openLogin"
          >
            <i-cy-profile_x16
              class="h-16px mr-8px w-16px block icon-dark-gray-500 icon-light-gray-100 group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50"
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
import ExternalLink from './ExternalLink.vue'

gql`
mutation GlobalPageHeader_clearActiveProject {
  clearActiveProject
}
`

gql`
fragment HeaderBar_HeaderBarContent on Query {
  currentProject {
    id
    title
  }
  ...TopNav
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
  if (props.gql.currentProject) {
    clearActiveProjectMutation.executeMutation({})
  }
}

const props = defineProps<{
  gql: HeaderBar_HeaderBarContentFragment,
  showBrowsers?: boolean,
  pageName?: string,
}>()

const { t } = useI18n()

</script>
