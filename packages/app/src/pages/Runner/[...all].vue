<template>
  <Runner
    v-if="query.data.value?.app?.activeProject"
    :gql="query.data.value.app?.activeProject?.currentSpec"
  />
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { useQuery } from '@urql/vue'
import { Runner_AllDocument } from '../../generated/graphql'
import Runner from '../../runner/Runner.vue'

gql`
query Runner_All {
  app {
    activeProject {
      id
      currentSpec {
        ...CurrentSpec_Runner
      }
    }
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
