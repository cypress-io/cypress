<template>
  <template v-if="loginConnectStore.isLoginConnectOpen">
    <LoginModal
      v-if="!loginConnectStore.isLoggedIn || keepLoginOpen"
      :gql="props.gql"
      :model-value="!loginConnectStore.isLoggedIn || keepLoginOpen"
      :utm-medium="loginConnectStore.utmMedium"
      :show-connect-button-after-login="!loginConnectStore.isProjectConnected"
      @connect-project="handleConnectProject"
      @cancel="handleCancel"
      @loggedin="handleLoginSuccess(loginConnectStore.isProjectConnected)"
      @update:model-value="handleUpdate(loginConnectStore.isProjectConnected, loginConnectStore.loginError)"
    />
    <CloudConnectModals
      v-else-if="loginConnectStore.isLoggedIn && !keepLoginOpen && !loginConnectStore.isProjectConnected"
      :show="loginConnectStore.isLoggedIn"
      :gql="props.gql"
      :utm-medium="loginConnectStore.utmMedium"
      @cancel="handleCancelConnect"
      @success="handleConnectSuccess"
    />
  </template>
</template>
<script setup lang="ts">
import { gql } from '@urql/vue'
import type { LoginConnectModalsContentFragment } from '../generated/graphql'
import LoginModal from './modals/LoginModal.vue'
import { ref, watch } from 'vue'
import { useLoginConnectStore } from '../store/login-connect-store'
import CloudConnectModals from './modals/CloudConnectModals.vue'

gql`
fragment LoginConnectModalsContent on Query {
  ...LoginModal
  ...CloudConnectModals
}
`

const props = defineProps<{
  gql: LoginConnectModalsContentFragment
}>()

const emit = defineEmits<{
  (eventName: 'handleConnectProject'): void
}>()

const loginConnectStore = useLoginConnectStore()
const { closeLoginConnectModal } = loginConnectStore

// keepLoginOpen is only set if you've just logged in
// and we want to show the "connect" button instead of "continue"
const keepLoginOpen = ref(false)

watch(() => loginConnectStore.isLoggedIn, (newVal, oldVal) => {
  // when login state changes, if we have logged in but are not connected,
  // keep the "login" modal open in the "connect project" state
  if (newVal && (!loginConnectStore.isProjectConnected || oldVal === false)) {
    keepLoginOpen.value = true
  }
})

const handleLoginSuccess = (isProjectConnected?: boolean) => {
  if (!isProjectConnected) {
    keepLoginOpen.value = true
  }
}

const handleCancel = () => {
  closeLoginConnectModal()
}

const handleUpdate = (isProjectConnected: boolean, error: boolean) => {
  if (error) {
    // always allow close if there is an error
    closeLoginConnectModal()

    return
  }

  if (!isProjectConnected) {
    // avoid double modals
    keepLoginOpen.value = true

    return
  }

  closeLoginConnectModal()
}
const handleConnectProject = async () => {
  // switch to Connect modal
  keepLoginOpen.value = false
  emit('handleConnectProject')
}

const handleCancelConnect = () => {
  closeLoginConnectModal()
}

const handleConnectSuccess = () => {
  closeLoginConnectModal()
}

</script>
