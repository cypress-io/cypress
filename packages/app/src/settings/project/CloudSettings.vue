<template>
  <ProjectId :gql="props.gql" />
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
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import RecordKey from './RecordKey.vue'
import ProjectId from './ProjectId.vue'
import type { CloudSettingsFragment } from '../../generated/graphql'

gql`
fragment CloudSettings on Query {
  ...ProjectId
  currentProject {
    id
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
  }
}
`

const props = defineProps<{
  gql: CloudSettingsFragment
}>()
</script>
