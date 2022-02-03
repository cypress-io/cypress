<template>
  <div class="bg-white border-b border-b-gray-100 h-64px py-15px px-6">
    <div class="flex h-full gap-12px items-center justify-between">
      <div
        v-if="pageName"
        class="whitespace-nowrap"
      >
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
          @click.prevent="clearCurrentProject"
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
          :force-open-docs="isForceOpenAllowed && isShowablePromptInSavedState"
          @clear-force-open="isForceOpenAllowed = false"
        >
          <template
            v-if="!!props.gql?.cloudViewer"
            #login-title
          >
            <UserAvatar
              :email="email"
              class="h-24px w-24px"
              data-cy="user-avatar-title"
            />
            <span class="sr-only">{{ t('topNav.login.profileMenuLabel') }}</span>
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
                  data-cy="user-avatar-panel"
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
        <div v-if="!props.gql?.cloudViewer">
          <button
            class="flex text-gray-600 group items-center focus:outline-transparent"
            @click="openLogin"
          >
            <i-cy-profile_x16
              class="h-16px mr-8px w-16px block icon-dark-gray-500 icon-light-gray-100 group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50"
            />
            <span class="font-semibold whitespace-nowrap group-hocus:text-indigo-500">{{ t('topNav.login.actionLogin') }}</span>
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
import { GlobalPageHeader_ClearCurrentProjectDocument, HeaderBar_HeaderBarContentFragment } from '../generated/graphql'
import TopNav from './topnav/TopNav.vue'
import LoginModal from './topnav/LoginModal.vue'
import UserAvatar from './topnav/UserAvatar.vue'
import Auth from './Auth.vue'
import { useI18n } from '@cy/i18n'
import ExternalLink from './ExternalLink.vue'
import interval from 'human-interval'
import { sortBy } from 'lodash'

gql`
mutation GlobalPageHeader_clearCurrentProject {
  clearCurrentProject {
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
  }
  ...TopNav
  ...Auth
}
`

const savedState = computed(() => {
  return props.gql?.currentProject?.savedState
})
const cloudProjectId = computed(() => {
  return props.gql?.currentProject?.config?.find((item: { field: string }) => item.field === 'projectId')?.value
})

const isLoginOpen = ref(false)
const clearCurrentProjectMutation = useMutation(GlobalPageHeader_ClearCurrentProjectDocument)
const email = computed(() => props.gql.cloudViewer?.email || undefined)

const openLogin = () => {
  isLoginOpen.value = true
}

const clearCurrentProject = () => {
  if (props.gql.currentProject) {
    clearCurrentProjectMutation.executeMutation({})
  }
}

const props = defineProps<{
  gql: HeaderBar_HeaderBarContentFragment,
  showBrowsers?: boolean,
  pageName?: string,
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
const isShowablePromptInSavedState = computed(() => {
  if (savedState.value) {
    for (const prompt of prompts) {
      if (shouldShowPrompt(prompt)) {
        return true
      }
    }
  }

  return false
})

function shouldShowPrompt (prompt: { slug: string; noProjectId: boolean; interval?: number }) {
  // we want the component using the header to control if the prompt shows at all
  if (props.allowAutomaticPromptOpen !== true) {
    return false
  }

  const now = Date.now()
  const timeSinceOpened = now - savedState.value?.firstOpened
  const allPromptShownTimes:number[] = Object.values(savedState.value?.promptsShown ?? {})

  // prompt has been shown
  if (savedState.value?.promptsShown?.[prompt.slug]) {
    return false
  }

  // any other prompt has been shown in the last 24 hours
  if (allPromptShownTimes?.find((time) => (now - time) < interval('24 hours'))) {
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
