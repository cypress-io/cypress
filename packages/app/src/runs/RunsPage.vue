<template>
  <div>
    <RunCard
      v-for="run of runs"
      :key="run.id"
      :gql="run"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
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

const runs = computed(() => props.gql.runs?.nodes || [])

</script>
