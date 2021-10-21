<template>
  <div>
    <h2>Runs Page</h2>
    <div v-if="query.fetching.value">
      Loading...
    </div>
    <div v-else-if="query.data.value?.app?.activeProject?.cloudProject">
      <RunsPage :gql="query.data.value.app.activeProject.cloudProject" />
    </div>
    <div v-else-if="query.data.value?.app?.activeProject">
      Connect the current project to the cloud
    </div>
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { RunsDocument } from '../generated/graphql'
import RunsPage from '../runs/RunsPage.vue'

gql`
query Runs {
  app {
    activeProject {
      cloudProject {
        ...RunsPage
      }
    }
  }
}`

const query = useQuery({ query: RunsDocument })
</script>

<route>
{
  name: "Runs Page"
}
</route>
