<template>
  <ProjectId
    :gql="props.gql.currentProject"
  />
  <template v-if="props.gql.currentProject?.cloudProject?.recordKeys?.length">
    <RecordKey
      v-for="key of props.gql.currentProject.cloudProject.recordKeys"
      :key="key.id"
      :gql="key"
    />
  </template>
  <template v-else>
    You don't have any record keys. You should make some so you can record
    on Cypress Cloud.
  </template>
  <SpecPatterns :gql="props.gql.currentProject" />
  <Experiments :gql="props.gql.currentProject" />
  <Config :gql="props.gql" />
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import RecordKey from './RecordKey.vue'
import Experiments from './Experiments.vue'
import ProjectId from './ProjectId.vue'
import Config from './Config.vue'
import SpecPatterns from './SpecPatterns.vue'
import type { ProjectSettingsFragment } from '../../generated/graphql'

gql`
fragment ProjectSettings on Query {
  currentProject {
    id
    ...ProjectId
    ...Experiments
    cloudProject {
      id
      recordKeys {
        id
        ...RecordKey
      }
    }
  }
  ...SpecPatterns
  ...Config
}
`

const props = defineProps<{
  gql: ProjectSettingsFragment
}>()
</script>
