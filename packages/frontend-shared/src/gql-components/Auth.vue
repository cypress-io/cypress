<template>
  <div
    v-if="props.showRetry"
    class="flex gap-[16px]"
  >
    <Button
      size="lg"
      @click="handleTryAgain"
    >
      <template
        #prefix
      >
        <i-cy-action-restart_x16
          class=" icon-light-white"
        />
      </template>
      {{ t('topNav.login.actionTryAgain') }}
    </Button>
    <Button
      variant="outline"
      size="lg"
      @click="handleCancel"
    >
      {{ t('topNav.login.actionCancel') }}
    </Button>
  </div>
  <div v-else-if="props.showLogout">
    <button
      class="bg-white border-rounded outline-transparent border-gray-100 border w-full py-[8px] text-[14px] text-indigo-500 block whitespace-nowrap hocus:border-gray-200 hover:no-underline"
      @click="handleLogout"
    >
      {{ t('topNav.login.actionLogout') }}
    </button>
  </div>
  <div v-else>
    <Button
      v-if="loginMutationIsPending"
      size="lg"
      variant="pending"
      aria-live="polite"
      :disabled="true"
    >
      <template
        #prefix
      >
        <i-cy-loading_x16
          class="animate-spin icon-dark-white icon-light-gray-400"
        />
      </template>
      {{ browserOpened ? t('topNav.login.actionWaiting') : t('topNav.login.actionOpening') }}
    </Button>
    <Button
      v-else
      ref="loginButtonRef"
      size="lg"
      variant="primary"
      aria-live="polite"
      :disabled="!cloudViewer && !isOnline"
      :prefix-icon="buttonPrefixIcon"
      @click="handleLoginOrContinue"
    >
      {{ buttonText }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import { useOnline } from '@vueuse/core'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'
import ChainIcon from '~icons/cy/chain-link_x16.svg'

import {
  Auth_LoginDocument,
  Auth_LogoutDocument,
  Auth_ResetAuthStateDocument,
} from '../generated/graphql'
import type {
  AuthFragment,
} from '../generated/graphql'
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

const userProjectStatusStore = useUserProjectStatusStore()

const { t } = useI18n()

const isOnline = useOnline()

const props = defineProps<{
  gql: AuthFragment
  showRetry?: boolean
  showLogout?: boolean
  utmMedium: string
  utmContent?: string
}>()

gql`
fragment Auth on Query {
  ...SelectCloudProjectModal
  cloudViewer {
    id
    email
    fullName
    firstOrganization: organizations(first: 1) {
      nodes {
        id
      }
    }
  }
  authState {
    browserOpened
    name
    message
  }
  currentProject {
    id
    cloudProject {
      __typename
      ... on CloudProject {
        id
      }
    }
  }
}
`

gql`
mutation Auth_Logout {
  logout {
    ...Auth
  }
}
`

gql`
mutation Auth_Login ($utmSource: String!, $utmMedium: String!, $utmContent: String) {
  login (utmSource: $utmSource, utmContent: $utmContent, utmMedium: $utmMedium) {
    ...Auth
  }
}
`

gql`
mutation Auth_ResetAuthState {
  resetAuthState {
    ...Auth
  }
}
`

const login = useMutation(Auth_LoginDocument)
const logout = useMutation(Auth_LogoutDocument)
const reset = useMutation(Auth_ResetAuthStateDocument)

const loginButtonRef = ref(Button)
const loginInitiated = ref(false)

onMounted(() => {
  loginButtonRef?.value?.$el?.focus()
})

onBeforeUnmount(() => {
  // If a log in was initiated from this component instance, then the auth state
  // may be polluted, due to the mutation still being fetched or due to
  // errors returned during the login process. So a reset occurs when
  // this instance unmounts to cover all scenarios where the LoginModal may be dismissed.
  //
  // We only perform the reset for the component that triggered a login
  // to prevent state conflicts when LoginModals are presented within the launchpad
  // and app simultaneously.
  if (loginInitiated.value) {
    reset.executeMutation({})
  }
})

const showConnectButton = computed(() => {
  return userProjectStatusStore.project.isConfigLoaded && userProjectStatusStore.cloudStatusMatches('needsProjectConnect')
})

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'cancel'): void
}>()

const cloudViewer = computed(() => {
  return props.gql.cloudViewer
})

const browserOpened = computed(() => {
  return props.gql.authState.browserOpened
})

// We determine that a login is pending if there is no current cloudViewer and
// either a login has been initiated from this component, or the browser has been
// successfully opened.
//
// It is possible for the browser to be open but not due to actions by this component,
// particularly when LoginModals are presented in both the launchpad and app simultaneously.
const loginMutationIsPending = computed(() => {
  return !cloudViewer.value && (loginInitiated.value || browserOpened.value)
})

const handleLoginOrContinue = async () => {
  if (userProjectStatusStore.user.isLoggedIn) {
    // user is already logged in, just emit close event & return early
    emit('close')

    return
  }

  // user has not already logged in, kick off the login process

  loginInitiated.value = true

  login.executeMutation({ utmMedium: props.utmMedium, utmContent: props.utmContent || null, utmSource: getUtmSource() })
}

const handleCancel = () => {
  emit('cancel')
}

const handleLogout = () => {
  logout.executeMutation({})
}

const handleTryAgain = async () => {
  await reset.executeMutation({})

  login.executeMutation({ utmMedium: props.utmMedium, utmContent: props.utmContent || null, utmSource: getUtmSource() })
}

const buttonText = computed(() => {
  const strings = {
    login: t('topNav.login.actionLogin'),
    connectProject: t('runs.connect.modal.selectProject.connectProject'),
    continue: t('topNav.login.actionContinue'),
  }

  if (showConnectButton.value) {
    return strings.connectProject
  }

  if (userProjectStatusStore.user.isLoggedIn) {
    return strings.continue
  }

  return strings.login
})

const buttonPrefixIcon = computed(() => {
  return showConnectButton.value ? ChainIcon : undefined
})

</script>
