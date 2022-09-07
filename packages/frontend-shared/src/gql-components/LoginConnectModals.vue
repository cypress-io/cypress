<template>
  <template
    v-if="query.data.value"
  >
    <LoginConnectModalsContent
      :gql="query.data.value"
      @handleConnectProject="executeQuery"
    />
  </template>
</template>
<script setup lang="ts">
import LoginConnectModalsContent from './LoginConnectModalsContent.vue'
import { gql, useQuery } from '@urql/vue'
import { LoginConnectModals_LoginConnectModalsQueryDocument } from '../generated/graphql'
import { watch } from 'vue'
import { useLoginConnectStore } from '../store/login-connect-store'
const loginConnectStore = useLoginConnectStore()

gql`
query LoginConnectModals_LoginConnectModalsQuery {
  ...LoginConnectModalsContent
}
`

const query = useQuery({ query: LoginConnectModals_LoginConnectModalsQueryDocument, pause: true })

watch(() => loginConnectStore.isLoginConnectOpen, (newVal) => {
  if (newVal) {
    executeQuery()
  }
})

const executeQuery = async () => {
  await query.executeQuery()
}

</script>
