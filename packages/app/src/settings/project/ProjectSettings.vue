<template>
  <ProjectId
    :gql="props.gql.currentProject"
  />
  <RecordKeySettings :gql="props.gql" />

  <SpecPatterns />
  <Experiments :gql="props.gql.currentProject" />
  <Config :gql="props.gql" />
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import RecordKeySettings from './RecordKeySettings.vue'
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
  }
  ...Config
  ...RecordKeySettings
}
`

const props = defineProps<{
  gql: ProjectSettingsFragment
}>()
</script>
