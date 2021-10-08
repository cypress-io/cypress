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
import Runner from '../../runs/Runner.vue'

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

const query = useQuery({ query: Runner_AllDocument })
</script>

<route>
{
  name: "Runner"
}
</route>
