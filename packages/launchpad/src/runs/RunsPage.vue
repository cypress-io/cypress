<template>
  <main class="min-w-650px max-w-800px">
    <div v-if="fetching">
      Loading, please wait a bit.
    </div>

    <div v-else-if="data?.viewer">
      <RunCard 
        v-for="run of runs" 
        :gql="run"
        :key="run.createdAt"
      />
    </div>

    <div v-else>
      <Auth :gql="data" />
    </div>
  </main>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { useQuery } from '@urql/vue'
import RunCard from './RunCard.vue'
import Auth from '../setup/Auth.vue'
import { RunsPageDocument } from '../generated/graphql'

gql`
query RunsPage {
  ...Auth
}
`

const { data, fetching } = useQuery({ 
  query: RunsPageDocument, 
  context: {
    additionalTypenames: ['CloudUser']
  }
})

const runs = [] // computed(() => data?.value?.viewer?.getProjectByProjectId?.runs || [])
</script>