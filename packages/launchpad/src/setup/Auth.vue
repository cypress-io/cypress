<template>
  <button @click="auth">Auth</button>
  {{ data }}
  Token: {{ data?.authToken }}
  is auth: {{ data?.authenticated }}
  {{ authed }}
  'email': {{ gql.email }}
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from "@urql/core"
import { useMutation } from "@urql/vue"
import { AuthDocument, AuthFragment, WizardLayoutNavigateDocument } from '../generated/graphql'

gql`
fragment Auth on User {
  authenticated
  authToken
  email
}
`

gql`
mutation Auth {
  authenticate {
    ...Auth
  }
}
`

const authMut = useMutation(AuthDocument)

const navigate = useMutation(WizardLayoutNavigateDocument)

const auth = () => {
  authMut.executeMutation({}).then(res => {
    console.log('res', res)
  })
}

const props = defineProps<{
  gql?: AuthFragment | null
}>()

const data = computed(() => props.gql)
const authed = computed(() => props.gql?.authToken)
</script>