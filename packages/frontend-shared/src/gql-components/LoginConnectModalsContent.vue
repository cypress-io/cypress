<template>
  <template v-if="loginConnectStore.isLoginConnectOpen">
    <LoginModal
      v-if="!loginConnectStore.user.isLoggedIn || keepLoginOpen"
      :gql="props.gql"
      :model-value="!loginConnectStore.user.isLoggedIn || keepLoginOpen"
      :utm-medium="loginConnectStore.utmMedium"
      :show-connect-button-after-login="loginConnectStore.project.isConfigLoaded && !loginConnectStore.project.isProjectConnected"
      @connect-project="handleConnectProject"
      @cancel="handleCancel"
      @loggedin="handleLoginSuccess(loginConnectStore.project.isProjectConnected)"
      @update:model-value="handleUpdate(loginConnectStore.project.isProjectConnected, loginConnectStore.user.loginError)"
    />
    <CloudConnectModals
      v-else-if="loginConnectStore.user.isLoggedIn && !keepLoginOpen && !loginConnectStore.project.isProjectConnected"
      :show="loginConnectStore.user.isLoggedIn"
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
  currentProject {
    id
    currentTestingType
  }
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

watch(() => loginConnectStore.user.isLoggedIn, (newVal, oldVal) => {
  // when login state changes, if we have logged in but are not connected,
  // keep the "login" modal open in the "connect project" state
  if (newVal && (!loginConnectStore.project.isProjectConnected || oldVal === false)) {
    keepLoginOpen.value = true
  }
})

const handleLoginSuccess = (isProjectConnected?: boolean) => {
  if (!isProjectConnected && !props.gql.currentProject?.currentTestingType) {
    keepLoginOpen.value = true
  }
}

const handleCancel = () => {
  closeLoginConnectModal()
}

const handleUpdate = (isProjectConnected: boolean, error: boolean) => {
  if (error || !props.gql.currentProject?.currentTestingType) {
    // always allow close if there is an error or no testing type
    // is found (meaning we are in the launchpad before config-loading,
    // so projectId will always appear to be missing)
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
