<template>
  <ProjectId :gql="props.gql" />
  <template
    v-if="props.gql.cloudProject?.__typename === 'CloudProject'
      && props.gql.cloudProject.recordKeys?.length"
  >
    <RecordKey
      v-for="key of props.gql.cloudProject.recordKeys"
      :key="key.id"
      :gql="key"
      :manage-keys-url="props.gql.cloudProject.cloudProjectSettingsUrl"
    />
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
  ...Config
}
`

const props = defineProps<{
  gql: ProjectSettingsFragment
}>()
</script>
