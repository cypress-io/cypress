<template>
  <div>
    <h2>Runs Page</h2>
    <div class="p-24px">
      <RunsSkeletton v-if="query.fetching.value" />
      <RunsPage
        v-else-if="query.data.value?.app?.activeProject?.cloudProject"
        :gql="query.data.value.app.activeProject.cloudProject"
      />
      <template v-else-if="query.data.value?.app?.activeProject">
        Connect the current project to the cloud
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
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
</script>

<route>
{
  name: "Runs"
}
</route>
