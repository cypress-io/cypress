<template>
  <SettingsSection
    code="specPattern"
    data-cy="settings-specPatterns"
  >
    <template #title>
      Spec patterns
    </template>
    <template #description>
      The globs pointing Cypress to your spec files configured for this project.
      <ExternalLink
        href="https://on.cypress.io/test-type-options"
      >
        Learn more.
      </ExternalLink>
    </template>
    <SpecPatterns
      v-if="props.gql"
      :gql="props.gql"
      data-cy="spec-pattern"
    />
  </SettingsSection>
</template>

<script lang="ts" setup>
import SettingsSection from '../SettingsSection.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { gql } from '@urql/core'
import type { SpecPatterns_SettingsFragment } from '../../generated/graphql'
import SpecPatterns from '../../components/SpecPatterns.vue'

gql`
fragment SpecPatterns_Settings on CurrentProject {
  id
  ...SpecPatterns
}
`

const props = defineProps<{
  gql: SpecPatterns_SettingsFragment | null
}>()
</script>
