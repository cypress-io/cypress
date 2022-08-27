<template>
  <CloudViewerAndProject
    v-if="props.gql && loginConnectStore.isLoginConnectOpen"
    v-slot="{status}"
    :gql="props.gql"
  >
    <LoginModal
      v-if="status"
      :gql="props.gql"
      :model-value="!status.isLoggedIn || keepLoginOpen"
      :utm-medium="loginConnectStore.utmMedium"
      :show-connect-button-after-login="!status.isProjectConnected"
      @connect-project="handleConnectProject"
      @cancel="closeLoginConnectModal"
      @loggedin="handleLoginSuccess(status.isProjectConnected)"
      @update:model-value="handleUpdate(status.isProjectConnected, status.error)"
    />
    <CloudConnectModals
      v-if="status?.isLoggedIn && !keepLoginOpen"
      :show="status?.isLoggedIn && isCloudConnectOpen"
      :gql="props.gql"
      @cancel="handleCancelConnect"
      @success="handleConnectSuccess"
    />
  </CloudViewerAndProject>
</template>
<script setup lang="ts">
import CloudViewerAndProject from './CloudViewerAndProject.vue'
import { gql } from '@urql/vue'
import type { LoginConnectModalsFragment } from '../generated/graphql'
import LoginModal from './modals/LoginModal.vue'
import { ref } from 'vue'
import { useLoginConnectStore } from '../store/login-connect-store'
import CloudConnectModals from './modals/CloudConnectModals.vue'

gql`
fragment LoginConnectModals on Query {
...CloudViewerAndProject
...LoginModal
...CloudConnectModals
}
`

const props = defineProps<{
  gql: LoginConnectModalsFragment
}>()

const loginConnectStore = useLoginConnectStore()
const { closeLoginConnectModal } = loginConnectStore

// keepLoginOpen is only set if you've just logged in
// and we want to show the "connect" button instead of "continue"
const keepLoginOpen = ref(true)
const isCloudConnectOpen = ref(true)

const handleLoginSuccess = (isProjectConnected?: boolean) => {
  if (!isProjectConnected) {
    keepLoginOpen.value = true
  }
}

const handleUpdate = (isProjectConnected?: boolean, error: boolean) => {
  if (error) {
    // always allow close if there is an error
    closeLoginConnectModal()
  }

  if (!isProjectConnected) {
    // avoid double modals
    keepLoginOpen.value = true

    return
  }

  closeLoginConnectModal()
}
const handleConnectProject = () => {
  // switch to Connect modal
  keepLoginOpen.value = false
}

const handleCancelConnect = () => {
  closeLoginConnectModal()
}

const handleConnectSuccess = () => {
  // isProjectConnectOpen = false; emit('success')
}

</script>
