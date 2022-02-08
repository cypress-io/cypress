<template>
  <div>Error page for testing.</div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { TestErrorDocument } from '../generated/graphql'

gql`
query TestError {
  testError
}
`

useQuery({ query: TestErrorDocument })
</script>
