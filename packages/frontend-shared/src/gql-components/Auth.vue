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
      ref="loginButtonRef"
      size="lg"
      :variant="buttonVariant"
      :disabled="isLoggingIn || !isOnline"
      aria-live="polite"
      @click="handleAuth"
    >
      <template
        v-if="isLoggingIn"
        #prefix
      >
        <i-cy-loading_x16
          class="animate-spin icon-dark-white icon-light-gray-400"
        />
      </template>
      {{ buttonMessage }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { gql } from '@urql/core'
import { useMutation, useQuery } from '@urql/vue'
import { useOnline } from '@vueuse/core'

import {
  Auth_LoginDocument,
  Auth_LogoutDocument,
  Auth_ResetAuthStateDocument,
  AuthFragment,
  Auth_BrowserOpenedDocument,
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
    email
    fullName
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

gql`
query Auth_BrowserOpened {
  authState {
    browserOpened
    name
    message
  }
}
`

const login = useMutation(Auth_LoginDocument)
const logout = useMutation(Auth_LogoutDocument)
const reset = useMutation(Auth_ResetAuthStateDocument)
const loginButtonRef = ref(Button)

onMounted(() => {
  loginButtonRef?.value?.$el?.focus()
})

const clickedOnce = ref(false)

const emit = defineEmits<{
  (event: 'continue', value: boolean): void
}>()

const viewer = computed(() => props.gql.cloudViewer)
const isBrowserOpened = computed(() => props.gql.authState.browserOpened)
const isLoggingIn = computed(() => clickedOnce.value && !viewer.value)

const query = useQuery({
  query: Auth_BrowserOpenedDocument,
  requestPolicy: 'cache-and-network',
})

const handleAuth = async () => {
  if (viewer.value) {
    emit('continue', true)

    return
  }

  clickedOnce.value = true

  const browserCheckInterval = setInterval(async () => {
    await query.executeQuery({})
    if (isBrowserOpened.value) {
      clearInterval(browserCheckInterval)
    }
  }, 1500)

  await login.executeMutation({})
}

const handleLogout = async () => {
  await logout.executeMutation({})
}

const buttonMessage = computed(() => {
  if (!isBrowserOpened.value && isLoggingIn.value) {
    return t('topNav.login.actionOpening')
  }

  if (!clickedOnce.value && !viewer.value) {
    return t('topNav.login.actionLogin')
  }

  if (isLoggingIn.value) {
    return t('topNav.login.actionWaiting')
  }

  if (viewer.value) {
    return t('topNav.login.actionContinue')
  }

  // default
  return t('topNav.login.actionLogin')
})

const buttonVariant = computed(() => {
  if (clickedOnce.value && !viewer.value) {
    return 'pending'
  }

  return 'primary'
})

const handleTryAgain = () => {
  reset.executeMutation({})
  login.executeMutation({})
}

const handleCancel = () => {
  reset.executeMutation({})
  emit('continue', true)
}

const { t } = useI18n()

</script>
