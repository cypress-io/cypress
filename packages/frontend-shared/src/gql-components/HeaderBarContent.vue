<template>
  <div
    data-cy="header-bar-content"
    class="bg-white border-b border-b-gray-100 h-64px py-15px px-6"
  >
    <div class="flex h-full gap-12px items-center justify-between">
      <div
        v-if="props.pageName"
        class="whitespace-nowrap"
      >
        {{ props.pageName }}
      </div>
      <div
        v-else
        class="flex font-medium text-gray-700 items-center children:leading-24px"
      >
        <img
          class="h-32px mr-18px w-32px"
          src="../assets/logos/cypress-dark.png"
          alt="cypress"
        >
        <nav>
          <ol>
            <li
              v-if="props.gql.isGlobalMode"
              class="inline-block"
            >
              <!-- context for use of aria role and disabled here: https://www.scottohara.me/blog/2021/05/28/disabled-links.html -->
              <!-- the `href` given here is a fake one provided for the sake of assistive technology. no actual routing is happening. -->
              <!-- the `key` is used to ensure the role/href attrs are added and removed appropriately from the element. -->
              <a
                :key="Boolean(currentProject).toString()"
                class="font-medium"
                :class="currentProject ? 'text-indigo-500 hocus-link-default' :
                  'text-gray-700'"
                :role="currentProject ? undefined : 'link'"
                :href="currentProject ? 'select-project' : undefined"
                :ariaDisabled="!currentProject"
                @click.prevent="clearCurrentProject"
              >
                {{ t('topNav.global.projects') }}
              </a>
            </li>
            <template v-if="currentProject?.title">
              <li
                v-if="props.gql.isGlobalMode"
                class="mx-2px align-middle inline-block"
                aria-hidden="true"
              >
                <i-cy-chevron-right_x16 class="icon-dark-gray-200" />
              </li>
              <li class="inline-block">
                <span class="font-medium">
                  {{ currentProject.title }}
                </span>
                <!-- currentProject might not have a branch -->
                <template v-if="currentProject.branch">
                  <!-- Using a margin here causes different overflow problems.
                      See PR #21325. Using a space for now. -->
                  {{ ' ' }}
                  <Tooltip
                    placement="bottom"
                    class="inline-block"
                  >
                    <span class="font-normal max-w-200px text-gray-500 inline-block truncate align-top">
                      ({{ currentProject.branch }})
                    </span>
                    <template #popper>
                      {{ currentProject.branch }}
                    </template>
                  </Tooltip>
                </template>
              </li>
              <template v-if="currentProject.currentTestingType">
                <li
                  class="mx-2px inline-block align-middle"
                  aria-hidden="true"
                >
                  <i-cy-chevron-right_x16 class="icon-dark-gray-200" />
                </li>
                <li class="inline-block">
                  {{ t(`testingType.${currentProject.currentTestingType}.name`) }}
                </li>
              </template>
            </template>
          </ol>
        </nav>
      </div>
      <div class="flex gap-6">
        <TopNav
          :gql="props.gql"
          :show-browsers="props.showBrowsers"
          :force-open-docs="isForceOpenAllowed && allowAutomaticPromptOpen"
          @clear-force-open="isForceOpenAllowed = false"
        >
          <template
            v-if="loginConnectStore.user.isLoggedIn"
            #login-title
          >
            <UserAvatar
              :email="loginConnectStore.userData?.email"
              class="h-24px w-24px"
              data-cy="user-avatar-title"
            />
            <span class="sr-only">{{ t('topNav.login.profileMenuLabel') }}</span>
          </template>
          <template
            v-if="loginConnectStore.userData"
            #login-panel
          >
            <div
              class="min-w-248px"
              data-cy="login-panel"
            >
              <div class="border-b flex border-b-gray-100 p-16px">
                <UserAvatar
                  :email="loginConnectStore.userData?.email"
                  class="h-48px mr-16px w-48px"
                  data-cy="user-avatar-panel"
                />
                <div>
                  <span class="text-gray-800">{{ loginConnectStore.userData?.fullName }}</span>
                  <br>
                  <span class="text-gray-600">{{ loginConnectStore.userData?.email }}</span>
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
                  utm-medium="Nav"
                />
              </div>
            </div>
          </template>
        </TopNav>
        <div v-if="!loginConnectStore.user.isLoggedIn">
          <button
            class="flex text-gray-600 items-center group focus:outline-transparent"
            @click="loginConnectStore.openLoginConnectModal({ utmMedium: 'Nav' })"
          >
            <i-cy-profile_x16
              class="h-16px mr-8px w-16px block icon-dark-gray-500 icon-light-gray-100 group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50"
            />
            <span class="font-medium whitespace-nowrap group-hocus:text-indigo-500">{{ t('topNav.login.actionLogin') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql, useMutation, useSubscription } from '@urql/vue'
import { ref, computed, onMounted } from 'vue'
import type { HeaderBar_HeaderBarContentFragment } from '../generated/graphql'
import {
  GlobalPageHeader_ClearCurrentProjectDocument,
  HeaderBarContent_AuthChangeDocument,
} from '../generated/graphql'
import TopNav from './topnav/TopNav.vue'
import UserAvatar from './topnav/UserAvatar.vue'
import Auth from './Auth.vue'
import { useI18n } from '@cy/i18n'
import ExternalLink from './ExternalLink.vue'
import Tooltip from '../components/Tooltip.vue'
import { useLoginConnectStore } from '../store/login-connect-store'

const loginConnectStore = useLoginConnectStore()

gql`
fragment HeaderBarContent_Auth on Query {
  cloudViewer {
    id
    fullName
    email
  }
  cachedUser {
    id
    fullName
    email
  }
}
`

gql`
subscription HeaderBarContent_authChange {
  authChange {
    ...Auth
    ...HeaderBarContent_Auth
  }
}
`

useSubscription({ query: HeaderBarContent_AuthChangeDocument })

gql`
mutation GlobalPageHeader_clearCurrentProject {
  clearCurrentProject {
    baseError {
      id
      ...BaseError
    }
    warnings {
      id
    }
    currentProject {
      id
    }
  }
}
`

gql`
fragment HeaderBar_HeaderBarContent on Query {
  currentProject {
    id
    title
    config
    savedState
    currentTestingType
    branch
  }
  isGlobalMode
  ...TopNav
  ...Auth
  ...HeaderBarContent_Auth
}
`

const currentProject = computed(() => props.gql.currentProject)

const clearCurrentProjectMutation = useMutation(GlobalPageHeader_ClearCurrentProjectDocument)

const clearCurrentProject = () => {
  if (currentProject.value) {
    clearCurrentProjectMutation.executeMutation({})
  }
}

const props = defineProps<{
  gql: HeaderBar_HeaderBarContentFragment
  showBrowsers?: boolean
  pageName?: string
  allowAutomaticPromptOpen?: boolean
}>()

const { t } = useI18n()

const isForceOpenAllowed = ref(true)
const isOpenDelayElapsed = ref(false)

onMounted(() => {
  setTimeout(() => isOpenDelayElapsed.value = true, 2000)
})

</script>
