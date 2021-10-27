<template>
  <div>
    <h2>Runs Page</h2>
    <main class="p-24px relative">
      <RunError
        v-if="!!query.error"
        :error="query.error"
      />
      <transition
        v-else-if="activeProject?.cloudProject"
        name="fade"
      >
        <RunsSkeleton v-if="query.fetching.value" />
        <RunsEmpty
          v-else-if="!activeProject.cloudProject.runs?.nodes.length"
          :project-id="activeProject.projectId || ''"
        />
        <div v-else>
          <RunCard
            v-for="run of activeProject.cloudProject.runs.nodes"
            :key="run.id"
            :gql="run"
          />
        </div>
      </transition>
      <RunsConnect
        v-else
        :has-project-id="!!activeProject?.projectId"
        :is-logged-in="!!query.data.value?.cloudViewer?.id"
      />
    </main>
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
import RunError from '../runs/RunError.vue'

gql`
query Runs {
  app {
    activeProject {
      id
      projectId
      cloudProject {
        id
        runs(first: 10){
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
}`

const query = useQuery({ query: RunsDocument })

const activeProject = computed(() => query.data.value?.app?.activeProject)
</script>

<route>
{
  name: "Runs"
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
