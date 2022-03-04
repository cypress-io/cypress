<template>
  <SpecPatterns :gql="props.gql.currentProject" />
  <Experiments :gql="props.gql.currentProject" />
  <Config :gql="props.gql" />
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import Experiments from './Experiments.vue'
import Config from './Config.vue'
import SpecPatterns from './SpecPatterns.vue'
import type { ProjectSettingsFragment } from '../../generated/graphql'

gql`
fragment ProjectSettings on Query {
  currentProject {
    id
    ...Experiments
    ...SpecPatterns_Settings
  }
  ...Config
}
`

const props = defineProps<{
  gql: ProjectSettingsFragment
}>()
</script>
