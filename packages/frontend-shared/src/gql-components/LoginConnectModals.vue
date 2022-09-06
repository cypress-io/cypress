<template>
  <template
    v-if="query.data.value"
  >
    <LoginConnectModalsContent
      :gql="query.data.value"
      @handleConnectProject="handleConnectProject"
    />
  </template>
</template>
<script setup lang="ts">
import LoginConnectModalsContent from './LoginConnectModalsContent.vue'
import { gql, useQuery } from '@urql/vue'
import { LoginConnectModals_LoginConnectModalsQueryDocument } from '../generated/graphql'

gql`
query LoginConnectModals_LoginConnectModalsQuery {
  ...LoginConnectModalsContent
}
`

const query = useQuery({ query: LoginConnectModals_LoginConnectModalsQueryDocument, pause: true })

query.executeQuery()

const handleConnectProject = () => {
  query.executeQuery()
}

</script>
