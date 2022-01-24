<template>
  <ProjectId :gql="props.gql.currentProject" />
  <template
    v-if="props.gql.currentProject?.cloudProject?.__typename === 'CloudProject'
      && props.gql.currentProject.cloudProject.recordKeys?.length"
  >
    <RecordKey
      v-for="key of props.gql.currentProject.cloudProject.recordKeys"
      :key="key.id"
      :gql="key"
      :manage-keys-url="props.gql.currentProject.cloudProject.cloudProjectSettingsUrl"
    />
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
      __typename
      ... on CloudProject {
        id
        cloudProjectSettingsUrl
        recordKeys {
          id
          ...RecordKey
        }
      }
    }
    ...SpecPatterns_Settings
  }
  ...Config
}
`

const props = defineProps<{
  gql: ProjectSettingsFragment
}>()
</script>
