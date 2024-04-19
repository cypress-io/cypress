<template>
  <div
    data-cy="header-bar-content"
    class="bg-white border-b border-b-gray-100 h-[64px] py-[15px] px-6"
  >
    <div class="flex h-full gap-[12px] items-center justify-between">
      <div
        v-if="props.pageName"
        class="whitespace-nowrap"
      >
        {{ props.pageName }}
      </div>
      <div
        v-else
        class="flex font-medium text-gray-700 items-center children:leading-[24px]"
        role="banner"
      >
        <img
          class="h-[32px] mr-[18px] w-[32px]"
          src="../assets/logos/cypress-dark.png"
          alt="cypress"
        >
        <div>
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
                class="mx-[2px] align-middle inline-block"
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
                    <span class="font-normal max-w-[200px] text-gray-500 inline-block truncate align-top">
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
                  class="mx-[2px] inline-block align-middle"
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
        </div>
      </div>
      <nav
        class="flex gap-6"
        role="navigation"
      >
        <TopNav
          :gql="props.gql"
          :show-browsers="props.showBrowsers"
          :force-open-docs="isForceOpenAllowed && isShowablePromptInSavedState"
          @clear-force-open="isForceOpenAllowed = false"
        >
          <template
            v-if="userProjectStatusStore.user.isLoggedIn"
            #login-title
          >
            <UserAvatar
              :email="userProjectStatusStore.userData?.email"
              class="h-[24px] w-[24px]"
              data-cy="user-avatar-title"
            />
            <span class="sr-only">{{ t('topNav.login.profileMenuLabel') }}</span>
          </template>
          <template
            v-if="userProjectStatusStore.userData"
            #login-panel
          >
            <div
              class="min-w-[248px]"
              data-cy="login-panel"
            >
              <div class="border-b flex border-b-gray-100 p-[16px]">
                <UserAvatar
                  :email="userProjectStatusStore.userData?.email"
                  class="h-[48px] mr-[16px] w-[48px]"
                  data-cy="user-avatar-panel"
                />
                <div>
                  <span class="text-gray-800">{{ userProjectStatusStore.userData?.fullName }}</span>
                  <br>
                  <span class="text-gray-600">{{ userProjectStatusStore.userData?.email }}</span>
                  <br>
                  <ExternalLink
                    href="https://on.cypress.io/dashboard/profile"
                  >
                    Profile Settings
                  </ExternalLink>
                </div>
              </div>

              <div class="p-[16px]">
                <Auth
                  :gql="props.gql"
                  :show-logout="true"
                  utm-medium="Nav"
                />
              </div>
            </div>
          </template>
        </TopNav>
        <div v-if="!userProjectStatusStore.user.isLoggedIn">
          <button
            class="flex text-gray-600 items-center group focus:outline-transparent"
            @click="userProjectStatusStore.openLoginConnectModal({ utmMedium: 'Nav' })"
          >
            <i-cy-profile_x16
              class="h-[16px] mr-[8px] w-[16px] block icon-dark-gray-500 icon-light-gray-100 group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50"
            />
            <span class="font-medium whitespace-nowrap group-hocus:text-indigo-500">{{ t('topNav.login.actionLogin') }}</span>
          </button>
        </div>
      </nav>
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
import interval from 'human-interval'
import { sortBy } from 'lodash'
import Tooltip from '../components/Tooltip.vue'
import type { AllowedState } from '@packages/types'
import { useUserProjectStatusStore } from '../store/user-project-status-store'

const userProjectStatusStore = useUserProjectStatusStore()

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
    # This ensures the cache is updated with null after clearing project
    migration {
      configFileNameBefore
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

const savedState = computed(() => {
  return props.gql?.currentProject?.savedState as AllowedState
})

const currentProject = computed(() => props.gql.currentProject)

const cloudProjectId = computed(() => {
  return props.gql?.currentProject?.config?.find((item: { field: string }) => item.field === 'projectId')?.value
})

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
const prompts = sortBy([
  {
    slug: 'ci1',
    interval: interval('4 days'),
    noProjectId: true,
  },
  {
    slug: 'orchestration1',
    noProjectId: true,
  },
], 'interval')
const isForceOpenAllowed = ref(true)
const isOpenDelayElapsed = ref(false)

onMounted(() => {
  setTimeout(() => isOpenDelayElapsed.value = true, 2000)
})

const isShowablePromptInSavedState = computed(() => {
  // We do not want to show a prompt if a banner is going to be shown, but some banners rely on cloud data
  // getting loaded before deciding whether to display. Add a delay here of a few seconds to give banners
  // a chance to display before deciding whether to show a prompt.
  if (!isOpenDelayElapsed.value) {
    return false
  }

  if (savedState.value) {
    for (const prompt of prompts) {
      if (shouldShowPrompt(prompt)) {
        return true
      }
    }
  }

  return false
})

function shouldShowPrompt (prompt: { slug: string, noProjectId: boolean, interval?: number }) {
  // we want the component using the header to control if the prompt shows at all
  if (props.allowAutomaticPromptOpen !== true) {
    return false
  }

  const now = Date.now()
  const timeSinceOpened = now - (savedState.value?.firstOpened ?? now)
  const allPromptShownTimes: number[] = Object.values(savedState.value?.promptsShown ?? {})
  const bannersLastShown = Object.values(savedState.value?.banners ?? {}).map((banner) => typeof banner === 'object' && banner?.lastShown).filter((val): val is number => !!val)

  // prompt has been shown
  if (savedState.value?.promptsShown?.[prompt.slug]) {
    return false
  }

  // any other prompt has been shown in the last 24 hours
  if (allPromptShownTimes?.find((time) => (now - time) < interval('24 hours'))) {
    return false
  }

  // If any tracked banners have been shown in the last 24 hours
  if (bannersLastShown.some((bannerLastShown) => (now - bannerLastShown) < interval('24 hours'))) {
    return false
  }

  // enough time has passed
  // no interval indicates *never* being shown automatically, so don't show if there's no interval
  if (!prompt.interval || timeSinceOpened < prompt.interval) {
    return false
  }

  // if prompt requires no project id,
  // check if project id exists
  if (prompt.noProjectId && cloudProjectId.value) {
    return false
  }

  return true
}
</script>
