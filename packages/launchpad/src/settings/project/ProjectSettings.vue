<template>
  <main class="divide-y divide-gray-200 children:pt-7 children:pb-7">
    <template v-if="app">
      <ProjectId 
        class="pt-0"
        :gql="app?.activeProject ?? null"
      />
      <template v-if="viewer?.recordKeys?.length">
        <RecordKey 
          v-for="key of viewer?.recordKeys"
          :key="key"
          :recordKey="key"
        />
      </template>
      <template v-else>
        You don't have any record keys. You should make some so you can record
        on Cypress Cloud.
      </template>
      <Experiments />
      <Config />
    </template>
  </main>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import RecordKey from './RecordKey.vue'
import Experiments from './Experiments.vue'
import ProjectId from './ProjectId.vue'
import Config from './Config.vue'
import { gql } from '@urql/core'
import { useQuery } from '@urql/vue'
import { ProjectSettingsDocument } from '../../generated/graphql'

gql`
query ProjectSettings { # ($projectId: String!)
  app {
    activeProject {
      ...ProjectId
      cloudProject {
        id
        recordKeys {
          id
          key
          lastUsedAt
        }
      }
    }
  }
}
`

const { data } = useQuery({ 
  query: ProjectSettingsDocument, 
  variables: {
    // projectId: "ypt4pf"
  } 
})

const app = computed(() => data.value?.app)
const viewer = computed(() => data.value?.cloudViewer)
</script>
