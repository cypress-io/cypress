<template>
  <RunsConnect
    v-if="!currentProject?.projectId || !cloudViewer?.id"
    :gql="props.gql"
  />
  <template v-else-if="currentProject?.cloudProject?.__typename === 'CloudProject'">
    <RunsEmpty
      v-if="!currentProject?.cloudProject?.runs?.nodes.length"
      :gql="currentProject"
    />
    <div
      v-else
      data-cy="runs"
    >
      <RunCard
        v-for="run of currentProject?.cloudProject?.runs?.nodes"
        :key="run.id"
        :gql="run"
      />
    </div>
  </template>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/vue'
import RunCard from './RunCard.vue'
import RunsConnect from './RunsConnect.vue'
import RunsEmpty from './RunsEmpty.vue'
import type { RunsContainerFragment } from '../generated/graphql'

gql`
fragment RunsContainer on Query {
  currentProject {
    id
    ...RunsEmpty
    cloudProject {
      __typename
      ... on CloudProject {
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
  gql: RunsContainerFragment
}>()

const currentProject = computed(() => props.gql.currentProject)
const cloudViewer = computed(() => props.gql.cloudViewer)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s
}

.fade-enter-from, .fade-leave-to {
  opacity: 0
}
</style>
