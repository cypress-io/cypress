<template>
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
  <SpecPatterns :gql="props.gql" />
  <Experiments :gql="props.gql" />
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
fragment ProjectSettings on CurrentProject {
  id
  ...ProjectId
  ...SpecPatterns
  ...Experiments
  ...Config
  cloudProject {
    id
    recordKeys {
      id
      ...RecordKey
    }
  }
}
`

const props = defineProps<{
  gql: ProjectSettingsFragment
}>()
</script>
