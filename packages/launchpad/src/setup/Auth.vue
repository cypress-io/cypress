<template>
  <div v-if="error">
    An error occurred while authenticating: {{ error }}
  </div>

  <div v-else-if="viewer">
    <p>
      Congrats {{ viewer?.email }}, you authenticated with Cypress Cloud.
    </p>
    <Button @click="handleLogout">
      Log out
    </Button>
  </div>

  <div v-else>
    <Button @click="handleAuth">
      Click to Authenticate
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import {
  LoginDocument,
  LogoutDocument,
  AuthFragment,
} from '../generated/graphql'
import Button from '../components/button/Button.vue'

const props = defineProps<{
  gql: AuthFragment
}>()

gql`
fragment Auth on Query {
  cloudViewer {
    id
    email
    fullName
  }
}
`

gql`
mutation Logout {
  logout {
    ...Auth
  }
}
`

gql`
mutation Login {
  login {
    ...Auth
  }
}
`

const login = useMutation(LoginDocument)
const logout = useMutation(LogoutDocument)
const error = ref<string>()

const handleAuth = async () => {
  const result = await login.executeMutation({})

  error.value = result.error?.message ?? undefined
}

const handleLogout = async () => {
  // clear this for good measure
  error.value = undefined
  await logout.executeMutation({})
}

const viewer = computed(() => props.gql?.cloudViewer)
</script>
