<template>
  <div v-if="error">
    An error occurred while authenticating: {{ error }}
  </div>

  <!-- <div v-else-if="viewer">
    <Button
      size="lg"
      @click="handleLogout">
      Log Out
    </Button>
  </div>-->

  <div>
    <Button
      size="lg"
      :variant="buttonVariant"
      @click="handleAuth"
    >
      {{ buttonMessage }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import {
  LoginDocument,
  LogoutDocument,
  AuthFragment,
} from '../generated/graphql'
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'

const props = defineProps<{
  gql: AuthFragment
}>()

gql`
fragment Auth on Query {
  cloudViewer {
    id
    email
    fullName
  }
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

const login = useMutation(LoginDocument)
const logout = useMutation(LogoutDocument)
const error = ref<string>()
const clickedOnce = ref(false)

const emit = defineEmits<{
  (event: 'continue', value: boolean): void
}>()

const handleAuth = async () => {
  if (viewer.value) {
    emit('continue', true)

    return
  }

  clickedOnce.value = true
  const result = await login.executeMutation({})

  error.value = result.error?.message ?? undefined
}

const handleLogout = async () => {
  // clear this for good measure
  error.value = undefined
  await logout.executeMutation({})
}

const viewer = computed(() => props.gql?.cloudViewer)

const buttonMessage = computed(() => {
  if (!clickedOnce.value && !viewer.value) {
    return t('topNav.login.actionLogin')
  }

  if (clickedOnce.value && !viewer.value) {
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
