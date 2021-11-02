<template>
  <RunsConnect
    v-if="!activeProject?.projectId || !cloudViewer?.id"
    :gql="props.gql"
  />
  <RunsEmpty
    v-else-if="!activeProject?.cloudProject?.runs?.nodes.length"
    :gql="activeProject"
  />
  <div
    v-else
    data-cy="runs"
  >
    <RunCard
      v-for="run of activeProject?.cloudProject?.runs?.nodes"
      :key="run.id"
      :gql="run"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/vue'
import RunCard from '../runs/RunCard.vue'
import RunsConnect from '../runs/RunsConnect.vue'
import RunsEmpty from '../runs/RunsEmpty.vue'
import type { RunsPageFragment } from '../generated/graphql'

gql`
fragment RunsPage on Query {
  app {
    activeProject {
      id
      ...RunsEmpty
      cloudProject {
        id
        runs(first: 10) {
          nodes {
            id
            ...RunCard
          }
        }
      }
    }
  }
  cloudViewer {
    id
  }
  ...RunsConnect
}`

const props = defineProps<{
  gql: RunsPageFragment
}>()

const activeProject = computed(() => props.gql.app?.activeProject)
const cloudViewer = computed(() => props.gql.cloudViewer)
</script>

<route>
{
  name: "Runs",
  meta: {
    title: "Runs"
  }
}
</route>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s
}

.fade-enter-from, .fade-leave-to {
  opacity: 0
}
</style>
