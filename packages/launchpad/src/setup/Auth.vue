<template>
  <div v-if="error">An error occurred while authenticating: {{ error }}</div>

  <div v-else-if="data?.value?.viewer">
    <p>
      Congrats {{ data?.value?.viewer?.email }}, you authenticated with Cypress Cloud.
    </p>
    <Button @click="handleLogout">Log out</Button>
  </div>

  <div v-else>
    <Button @click="handleAuth">Click to Authenticate</Button>
  </div>
  
  {{ data }}
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { gql } from "@urql/core"
import { useMutation, useQuery } from "@urql/vue"
import { 
  LoginDocument,
  LogoutDocument,
  AuthenticateFragment,
AuthDocument
  } from '../generated/graphql'
import Button from '../components/button/Button.vue'

gql`
fragment Authenticate on Viewer {
  email
  authToken
}
`

gql`
mutation Logout {
  logout {
    ...Authenticate
  }
}
`

gql`
mutation Login {
  login {
    ...Authenticate
  }
}
`

gql`
query Auth {
  viewer {
    ...Authenticate
  }
}
`

const login = useMutation(LoginDocument)
const logout = useMutation(LogoutDocument)
const error = ref<string>()

const additionalTypenames = { additionalTypenames: ['Viewer'] }

const handleAuth = async () => {
  const result = await login.executeMutation({}, additionalTypenames)
  error.value = result.error?.message ?? undefined
}

const handleLogout = async () => {
  // clear this for good measure
  error.value = undefined
  await logout.executeMutation({}, additionalTypenames)
}

const result = useQuery({ 
  query: AuthDocument,
  context: {
    additionalTypenames: ['Viewer']
  }
})

const data = computed(() => result.data)

watch(result, (val) => {
  console.log(val.data.value?.viewer)
})
</script>