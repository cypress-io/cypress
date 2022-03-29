<template>
  <div
    v-if="props.showRetry"
    class="flex gap-16px"
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
      class="bg-white border-rounded outline-transparent border-gray-100 border-1 w-full py-8px text-14px text-indigo-500 block whitespace-nowrap hocus:border-gray-200 hover:no-underline"
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
      @click="handleLoginOrContinue"
    >
      {{ cloudViewer ? t('topNav.login.actionContinue') : t('topNav.login.actionLogin') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import { useOnline } from '@vueuse/core'

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

const isOnline = useOnline()

const props = defineProps<{
  gql: AuthFragment
  showRetry?: boolean
  showLogout?: boolean
}>()

gql`
fragment Auth on Query {
  cloudViewer {
    id
  }
  authState {
    browserOpened
    name
    message
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
mutation Auth_Login {
  login {
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

const emit = defineEmits<{
  (event: 'continue', value: boolean): void
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
  if (cloudViewer.value) {
    emit('continue', true)

    return
  }

  loginInitiated.value = true

  login.executeMutation({})
}

const handleLogout = () => {
  logout.executeMutation({})
}

const handleTryAgain = async () => {
  await reset.executeMutation({})

  login.executeMutation({})
}

const handleCancel = () => {
  emit('continue', true)
}

const { t } = useI18n()

</script>
