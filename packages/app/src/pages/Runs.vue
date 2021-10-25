<template>
  <div>
    <h2>Runs Page</h2>
    <div class="p-24px relative">
      <transition
        name="fade"
      >
        <template v-if="!delayedMounted && query.fetching.value">
          &nbsp;
        </template>
        <RunsSkeletton v-else-if="query.fetching.value" />
        <RunsPage
          v-else-if="query.data.value?.app?.activeProject?.cloudProject"
          :gql="query.data.value.app.activeProject.cloudProject"
        />
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
import RunsPage from '../runs/RunsPage.vue'
import RunsSkeletton from '../runs/RunsSkeletton.vue'

gql`
query Runs {
  app {
    activeProject {
      id
      projectId
      cloudProject {
        id
        ...RunsPage
      }
    }
  }
}`

const query = useQuery({ query: RunsDocument })

const delayedMounted = onMountedDelayed(200)
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
