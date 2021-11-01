<template>
  <div class="divide-y divide-gray-200 children:pt-7 children:pb-7">
    <ProjectId
      :gql="props.gql"
    />
    <template v-if="props.gql.cloudProject?.recordKeys?.length">
      <RecordKey
        v-for="key of props.gql.cloudProject.recordKeys"
        :key="key.id"
        :gql="key"
      />
    </template>
    <template v-else>
      You don't have any record keys. You should make some so you can record
      on Cypress Cloud.
    </template>
    <Experiments />
    <Config :gql="props.gql" />
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import RecordKey from './RecordKey.vue'
import Experiments from './Experiments.vue'
import ProjectId from './ProjectId.vue'
import Config from './Config.vue'
import type { ProjectSettingsFragment } from '../../generated/graphql'

gql`
fragment ProjectSettings on Project{
  id
  ...ProjectId
  ...Config
  cloudProject {
    id
    recordKeys {
      ...RecordKey
    }
  }
}
`

const props = defineProps<{
  gql: ProjectSettingsFragment
}>()
</script>
