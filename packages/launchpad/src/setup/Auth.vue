<template>
  <Button @click="handleAuth">Click to Authenticate</Button>

  <div v-if="error">An error occurred while authenticating: {{ error }}</div>

  <div v-else-if="data?.user?.email">
    <p>
      Congrats {{ data?.user?.email }}, you authenticated with Cypress Cloud.
    </p>
  </div>

  <div v-else>
    Nothing here yet
  </div>
</template>

<script lang="ts" setup>
import { computed, ref,watch } from 'vue'
import { gql } from "@urql/core"
import { useMutation } from "@urql/vue"
import { AuthenticateDocument, UserFragment } from '../generated/graphql'
import Button from '../components/button/Button.vue'

gql`
fragment User on App {
  user {
    email
    authToken
  }
}
`

gql`
mutation authenticate {
  authenticate {
    ...User
  }
}
`

const authenticate = useMutation(AuthenticateDocument)
const error = ref<string>()

const handleAuth = async () => {
  const result = await authenticate.executeMutation({})
  error.value = result.error?.message ?? undefined
}

const props = defineProps<{
  gql?: UserFragment | null
}>()

const data = computed(() => props.gql)
</script>