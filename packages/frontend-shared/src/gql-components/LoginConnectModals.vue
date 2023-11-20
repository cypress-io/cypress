<!--
/**==============================================
 * *             LoginConnectModals.vue
 *
 * Logging in to Cypress Cloud and connecting/creating projects
 * represent a set of mutually-exclusive steps in a flow.
 *
 * The LoginConnectModals component is intended to be rendered
 * in one place per Vue application (App or Launchpad). It will derive
 * the correct current step of the flow based on information from GQL,
 * the login-connect-store, and its internal component state.
 *
 * This means that other components do not have to manage
 * multiple instances of these modals. Instead, they can call the
 * `openLoginConnectModal` method from the login-connect-store.
 * and expect that everything will work correctly from there.
 *
 * For example usage, see CloudConnectButton.vue or HeaderBarContent.vue
 *
 * ============================================**/
-->

<template>
  <LoginConnectModalsContent
    v-if="userProjectStatusStore.isLoginConnectOpen"
    :gql="query.data.value"
  />
</template>
<script setup lang="ts">
import LoginConnectModalsContent from './LoginConnectModalsContent.vue'
import { gql, useQuery } from '@urql/vue'
import { LoginConnectModals_LoginConnectModalsQueryDocument } from '../generated/graphql'
import { useUserProjectStatusStore } from '../store/user-project-status-store'
import { whenever } from '@vueuse/core'
const userProjectStatusStore = useUserProjectStatusStore()

gql`
query LoginConnectModals_LoginConnectModalsQuery {
  ...LoginConnectModalsContent
}
`

const query = useQuery({ query: LoginConnectModals_LoginConnectModalsQueryDocument, pause: true })

const executeQuery = async () => {
  await query.executeQuery()
}

whenever(() => userProjectStatusStore.isLoginConnectOpen, executeQuery)

</script>
