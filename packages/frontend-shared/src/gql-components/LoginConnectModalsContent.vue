<template>
  <template v-if="userProjectStatusStore.isLoginConnectOpen && gqlRef">
    <LoginModal
      v-if="cloudStatusMatches('isLoggedOut') || keepLoginOpen"
      :gql="gqlRef"
      :utm-medium="userProjectStatusStore.utmMedium"
      :utm-content="userProjectStatusStore.utmContent"
      @cancel="closeLoginConnectModal"
      @close="handleCloseLogin"
    />
    <RecordRunModal
      v-else-if="cloudStatusMatches('needsRecordedRun')"
      :utm-medium="userProjectStatusStore.utmMedium"
      :utm-content="userProjectStatusStore.utmContent"
      @cancel="closeLoginConnectModal"
    />
    <CloudConnectModals
      v-else-if="cloudStatusMatches('needsProjectConnect') || cloudStatusMatches('needsOrgConnect')"
      :show="userProjectStatusStore.user.isLoggedIn"
      :gql="gqlRef"
      :utm-medium="userProjectStatusStore.utmMedium"
      :utm-content="userProjectStatusStore.utmContent"
      @cancel="closeLoginConnectModal"
      @success="closeLoginConnectModal"
    />
  </template>
</template>
<script setup lang="ts">
import { gql } from '@urql/vue'
import type { LoginConnectModalsContentFragment } from '../generated/graphql'
import LoginModal from './modals/LoginModal.vue'
import { ref, watch } from 'vue'
import { useUserProjectStatusStore } from '../store/user-project-status-store'
import CloudConnectModals from './modals/CloudConnectModals.vue'
import RecordRunModal from './RecordRunModal.vue'
import { debouncedWatch } from '@vueuse/core'

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
  gql?: LoginConnectModalsContentFragment
}>()

const userProjectStatusStore = useUserProjectStatusStore()
const { closeLoginConnectModal, cloudStatusMatches } = userProjectStatusStore

// use this to hold login open after the transition between logged out and logged in
// this is to show the temporary "continue" state and its variations
// that only exist if you have used the modal to log in
const keepLoginOpen = ref(false)

watch(() => userProjectStatusStore.cloudStatus, (newVal, oldVal) => {
  if (oldVal === 'isLoggedOut' && newVal !== 'isLoggedOut') {
    keepLoginOpen.value = true
  }
}, {
  immediate: true,
})

const handleCloseLogin = () => {
  if (cloudStatusMatches('allTasksCompleted')) {
    closeLoginConnectModal()
  } else {
    keepLoginOpen.value = false
  }
}

// TODO: confirm why `props.gql` is briefly null in tests after initial render.
// Are we doing a reset somewhere as part of the testing setup?

// We debounce gql because, in tests, the gql prop can sometimes be `null`
// for a split second, causing "Detached from DOM" problems, so we are
//debouncing gql before it gets passed into the login/connect/record modals.
// This seems like a good idea anyway, it will also prevent flashes of very temporary states
const gqlRef = ref<LoginConnectModalsContentFragment | null>(null)

debouncedWatch(() => props.gql, (newVal) => {
  if (newVal) {
    gqlRef.value = newVal
  }
}, {
  debounce: 10,
  immediate: true,
})

</script>
