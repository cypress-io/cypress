<template>
  <main class="min-w-650px max-w-800px">
    <div v-if="props.gql.runs?.nodes">
      <RunCard
        v-for="run of props.gql.runs.nodes" 
        :gql="run"
        :key="run.id"
      />
    </div>
  </main>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import RunCard from './RunCard.vue'
import type { RunsPageFragment } from '../generated/graphql'

gql`
fragment RunsPage on CloudProject {
  runs(first: 10) {
    nodes {
      ...RunCard
    }
  }
}
`

const props = defineProps<{
  gql: RunsPageFragment
}>()
</script>