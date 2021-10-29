<template>
  <main class="divide-y divide-gray-200 children:pt-7 children:pb-7">
    <template v-if="app?.currentProject">
      <ProjectId
        class="pt-0"
        :gql="app.currentProject"
      />
      <template v-if="app.currentProject.cloudProject">
        <RecordKey
          v-for="key of app.currentProject.cloudProject.recordKeys"
          :key="key.id"
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
  app {
    currentProject {
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
}
`

const { data } = useQuery({
  query: ProjectSettingsDocument,
})

const app = computed(() => data.value?.app)
</script>
