<template>
  <div>
    <h2>Runs Page</h2>
    <main class="p-24px relative">
      <transition
        name="fade"
      >
        <RunsSkeletton v-if="query.fetching.value" />
        <template v-else-if="cloudRunNodes">
          <div v-if="cloudRunNodes.length > 0">
            <RunCard
              v-for="run of cloudRunNodes"
              :key="run.id"
              :gql="run"
            />
          </div>
          <div
            v-else
            data-e2e="no-runs"
          >
            No runs... record one to the cloud?
          </div>
        </template>
        <template v-else-if="query.data.value?.app?.activeProject">
          Connect the current project to the cloud
        </template>
      </transition>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql, useQuery } from '@urql/vue'
import { RunsDocument } from '../generated/graphql'
import RunCard from '../runs/RunCard.vue'
import RunsSkeletton from '../runs/RunsSkeletton.vue'

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
}`

const query = useQuery({ query: RunsDocument })
const cloudRunNodes = computed(() => query.data.value?.app.activeProject?.cloudProject?.runs?.nodes)
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
