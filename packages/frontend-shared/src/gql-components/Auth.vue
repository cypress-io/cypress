<template>
  <div v-if="error">
    An error occurred while authenticating: {{ error }}
  </div>

  <div v-else-if="showLogout">
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
          v-if="isLoggingIn"
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
  LoginDocument,
  LogoutDocument,
  AuthFragment,
  BrowserOpenedDocument,
} from '../generated/graphql'
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'

const isOnline = useOnline()

const props = defineProps<{
  gql: AuthFragment,
  showLogout?: boolean
}>()

gql`
fragment Auth on Query {
  cloudViewer {
    id
    email
    fullName
  }
  isAuthBrowserOpened
}
`

gql`
mutation Logout {
  logout {
    ...Auth
  }
}
`

gql`
mutation Login {
  login {
    ...Auth
  }
}
`

gql`
query BrowserOpened {
  isAuthBrowserOpened
}
`

const login = useMutation(LoginDocument)
const logout = useMutation(LogoutDocument)
const loginButtonRef = ref(Button)

onMounted(() => {
  loginButtonRef?.value?.$el?.focus()
})

const error = ref<string>()
const clickedOnce = ref(false)

const emit = defineEmits<{
  (event: 'continue', value: boolean): void
}>()

const viewer = computed(() => props.gql.cloudViewer)
const isBrowserOpened = computed(() => props.gql.isAuthBrowserOpened)
const isLoggingIn = computed(() => clickedOnce.value && !viewer.value)

const query = useQuery({
  query: BrowserOpenedDocument,
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

  const result = await login.executeMutation({})

  error.value = result.error?.message ?? undefined
}

const handleLogout = async () => {
  // clear this for good measure
  error.value = undefined
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

const { t } = useI18n()

</script>
