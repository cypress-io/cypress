<template>
  <CloudViewerAndProject
    v-if="props.gql && loginConnectStore.isLoginConnectOpen"
    v-slot="{status}"
    :gql="props.gql"
  >
    <LoginModal
      :gql="props.gql"
      :model-value="!status?.isLoggedIn || keepLoginOpen"
      utm-medium="Runs Tab"
      :show-connect-button-after-login="!status?.isProjectConnected"
      @connect-project="handleConnectProject"
      @success="handleLoginSuccess"
    />
    <CloudConnectModals
      v-if="status?.isLoggedIn"
      :show="status?.isLoggedIn"
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const keepLoginOpen = ref(false)

const handleLoginSuccess = () => {
  keepLoginOpen.value = true
}
const handleConnectProject = () => {
  // switch to Connect modal
}

const handleCancelConnect = () => {

}

const handleConnectSuccess = () => {
  // isProjectConnectOpen = false; emit('success')
}

const loginConnectStore = useLoginConnectStore()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { setIsLoginConnectOpen } = loginConnectStore

</script>
