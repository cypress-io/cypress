<template>
  <div class="relative p-24px h-full overflow-y-scroll">
    <transition
      v-if="query.fetching.value || activeProject?.cloudProject?.runs?.nodes.length"
      name="fade"
    >
      <RunsSkeleton v-if="query.fetching.value" />
      <div
        v-else-if="activeProject?.cloudProject?.runs?.nodes.length"
        data-cy="runs"
      >
        <RunCard
          v-for="run of activeProject.cloudProject.runs.nodes"
          :key="run.id"
          :gql="run"
        />
      </div>
    </transition>
    <RunsConnect
      v-else-if="query.data.value && (!activeProject?.projectId || !query.data.value.cloudViewer?.id)"
      :is-logged-in="!!query.data.value.cloudViewer?.id"
      :gql="query.data.value"
    />
    <RunsEmpty
      v-else
      :project-id="activeProject?.projectId || ''"
      :project-name="activeProject?.title || ''"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql, useQuery } from '@urql/vue'
import { RunsDocument } from '../generated/graphql'
import RunCard from '../runs/RunCard.vue'
import RunsSkeleton from '../runs/RunsSkeleton.vue'
import RunsConnect from '../runs/RunsConnect.vue'
import RunsEmpty from '../runs/RunsEmpty.vue'

gql`
query Runs {
  app {
    activeProject {
      id
      title
      projectId
      cloudProject {
        id
        runs {
          nodes {
            id
            ...RunCard
          }
        }
      }
    }
    isAuthBrowserOpened
  }
  cloudViewer {
    id
    email
    fullName
  }
}`

const query = useQuery({ query: RunsDocument })

const activeProject = computed(() => query.data.value?.app?.activeProject)
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
