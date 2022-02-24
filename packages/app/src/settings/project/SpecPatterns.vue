<template>
  <SettingsSection
    code="specPattern"
    data-cy="settings-specPatterns"
  >
    <template #title>
      {{ t('settingsPage.specPattern.title') }}
    </template>
    <template #description>
      <i18n-t
        scope="global"
        keypath="settingsPage.specPattern.description"
      >
        <ExternalLink
          href="https://on.cypress.io/test-type-options"
        >
          {{ t('links.learnMore') }}
        </ExternalLink>
      </i18n-t>
    </template>
    <SpecPatterns
      v-if="props.gql"
      :gql="props.gql"
      data-cy="spec-pattern"
    />
  </SettingsSection>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import SettingsSection from '../SettingsSection.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { gql } from '@urql/core'
import type { SpecPatterns_SettingsFragment } from '../../generated/graphql'
import SpecPatterns from '../../components/SpecPatterns.vue'

const { t } = useI18n()

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
