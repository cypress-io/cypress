<template>
  <main class="min-w-650px max-w-800px">
    <div v-if="fetching">
      Loading, please wait a bit.
    </div>

    <!-- <div v-else-if="data?.cloudViewer">
      <RunCard
        v-for="run of runs" 
        :gql="run"
        :key="run.createdAt"
      />
    </div> -->

    <div v-else>
      <Auth :gql="data" />
    </div>
  </main>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/core'
import { useQuery } from '@urql/vue'
import RunCard from './RunCard.vue'
import Auth from '../setup/Auth.vue'
import { RunsPageDocument } from '../generated/graphql'

gql`
query RunsPage {
  ...Auth
  cloudViewer {
    id
  }
}
`

const result = useQuery({ 
  query: RunsPageDocument,
})

const data = computed(() => result.data.value)
const fetching = computed(() => result.fetching.value)

const runs = [] // computed(() => data?.value?.viewer?.getProjectByProjectId?.runs || [])
</script>