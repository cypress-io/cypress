<template>
  <Runner
    v-if="query.data.value?.app"
    :gql="query.data.value.app"
  />
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { useQuery } from '@urql/vue'
import { Runner_AllDocument } from '../../generated/graphql'
import Runner from '../../runs/Runner.vue'

gql`
query Runner_All {
  app {
    ...Specs_Runner
  }
}
`

// network-only - we do not want to execute a stale spec
const query = useQuery({
  query: Runner_AllDocument,
  requestPolicy: 'network-only',
})
</script>

<route>
{
  name: "Runner"
}
</route>
