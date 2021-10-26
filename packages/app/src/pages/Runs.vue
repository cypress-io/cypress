<template>
  <div>
    <h2>Runs Page</h2>
    <div class="p-24px relative">
      <transition
        name="fade"
      >
        <template v-if="!delayedMountedFlag && query.fetching.value">
          &nbsp;
        </template>
        <RunsSkeletton v-else-if="query.fetching.value" />
        <div
          v-else-if="query.data.value?.app?.activeProject?.cloudProject?.runs?.nodes"
        >
          <RunCard
            v-for="run of query.data.value.app.activeProject.cloudProject.runs.nodes"
            :key="run.id"
            :gql="run"
          />
        </div>
        <template v-else-if="query.data.value?.app?.activeProject">
          Connect the current project to the cloud
        </template>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMountedDelayed } from '@packages/frontend-shared/src/composables'
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
          id
          ...RunsCard
        }
      }
    }
  }
}`

const query = useQuery({ query: RunsDocument })

const delayedMountedFlag = onMountedDelayed(200)
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
