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
      v-if="login.fetching.value"
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
      {{ !props.gql.authState.browserOpened ? t('topNav.login.actionOpening') : t('topNav.login.actionWaiting') }}
    </Button>
    <Button
      v-else
      ref="loginButtonRef"
      size="lg"
      variant="primary"
      aria-live="polite"
      :disabled="!cloudViewer && !isOnline"
      @click="handleAuth"
    >
      {{ !cloudViewer ? t('topNav.login.actionLogin') : t('topNav.login.actionContinue') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
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

const login = useMutation(Auth_LoginDocument)
const logout = useMutation(Auth_LogoutDocument)
const reset = useMutation(Auth_ResetAuthStateDocument)
const loginButtonRef = ref(Button)

onMounted(() => {
  loginButtonRef?.value?.$el?.focus()
})

const emit = defineEmits<{
  (event: 'continue', value: boolean): void
}>()

const cloudViewer = computed(() => {
  return props.gql.cloudViewer
})

const handleAuth = () => {
  if (cloudViewer.value) {
    emit('continue', true)

    return
  }

  login.executeMutation({})
}

const handleLogout = async () => {
  await logout.executeMutation({})
}

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
