<template>
  <main class="divide-y divide-gray-200 children:pt-7 children:pb-7">
    <template v-if="data?.activeProject">
      <ProjectId 
        class="pt-0"
        :gql="data?.activeProject"
      />
      <template v-if="data?.activeProject.cloudProject">
        <RecordKey 
          v-for="key of data?.activeProject.cloudProject.recordKeys"
          :gql="key"
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
query ProjectSettings {
  activeProject {
    id
    ...ProjectId
    cloudProject {
      id
      recordKeys {
        ...RecordKey
      }
    }
  }
}
`

const resp = useQuery({ 
  query: ProjectSettingsDocument, 
})

const data = computed(() => resp.data.value)
</script>
