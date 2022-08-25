<template>
  <CloudViewerAndProject
    v-if="props.gql"
    v-slot="{status}"
    :gql="props.gql"
  >
    <div v-if="!status?.isLoggedIn">
      logged out
    </div>
    <div v-else>
      logged in
    </div>
  </CloudViewerAndProject>
</template>
<script setup lang="ts">
import CloudViewerAndProject from './CloudViewerAndProject.vue'
import { gql } from '@urql/vue'
import type { LoginConnectModalsFragment } from '../generated/graphql'

gql`
fragment LoginConnectModals on Query {
...CloudViewerAndProject
}
`

const props = defineProps<{
  gql: LoginConnectModalsFragment
}>()

import { useLoginConnectStore } from '../store/login-connect-store'

const loginConnectStore = useLoginConnectStore()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { setIsLoginConnectOpen } = loginConnectStore

</script>
