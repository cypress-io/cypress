<template>
  <div v-if="error">An error occurred while authenticating: {{ error }}</div>

  <div v-else-if="data?.authenticated">
    <p>
      Congrats {{ data?.email }}, you authenticated with Cypress Cloud.
    </p>
    <Button @click="handleLogout">Log out</Button>
  </div>

  <div v-else>
    <Button @click="handleAuth">Click to Authenticate</Button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { gql } from "@urql/core"
import { useMutation } from "@urql/vue"
import { 
  AuthenticateDocument, 
  AuthenticateFragment, 
  LogoutDocument
  } from '../generated/graphql'
import Button from '../components/button/Button.vue'

gql`
fragment Authenticate on Viewer {
  email
  authToken
  authenticated
}
`

gql`
mutation authenticate {
  authenticate {
    ...Authenticate
  }
}
`

gql`
mutation Logout {
  logout {
    ...Authenticate
  }
}
`

const authenticate = useMutation(AuthenticateDocument)
const logout = useMutation(LogoutDocument)
const error = ref<string>()

const handleAuth = async () => {
  const result = await authenticate.executeMutation({})
  error.value = result.error?.message ?? undefined
}

const props = defineProps<{
  gql?: AuthenticateFragment | null
}>()

const handleLogout = async () => {
  // clear this for good measure
  error.value = undefined
  await logout.executeMutation({})
}

const data = computed(() => props.gql)

watch(data, (val) => {
  console.log(val?.authToken)
})
</script>