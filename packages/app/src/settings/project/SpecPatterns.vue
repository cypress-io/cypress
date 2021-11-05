<template>
  <SettingsSection
    code="specPattern"
    data-cy="settings-specPatterns"
  >
    <template #title>
      {{ t('settingsPage.specPattern.title') }}
    </template>
    <template #description>
      <i18n-t keypath="settingsPage.specPattern.description">
        <ExternalLink
          href="https://docs.cypress.io"
        >
          {{ t('links.learnMore') }}
        </ExternalLink>
      </i18n-t>
    </template>
    <div class="border border-gray-200 rounded overflow-hidden">
      <div class="border-b border-gray-200 h-56px flex justify-between p-16px">
        <StatusIndicator
          :type="defaultValues ? 'success' : 'disabled'"
        >
          {{ t('settingsPage.specPattern.defaultIndicator') }}
        </StatusIndicator>
        <span class="bg-jade-100 text-jade-600 rounded text-size-14px px-8px py-4px leading-16px">
          <i18n-t keypath="settingsPage.specPattern.matches">
            {{ matches }}
          </i18n-t>
        </span>
      </div>
      <div class="px-16px bg-gray-50 divide-y-1 divide-gray-200">
        <code
          v-for="pattern in specPatterns"
          :key="pattern"
          class="block flex py-8px text-gray-600 text-size-14px leading-24px"
        >
          {{ pattern }}
        </code>
      </div>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/vue'
import StatusIndicator from '@cy/components/StatusIndicator.vue'
import type { SpecPatternsFragment } from '../../generated/graphql'
import SettingsSection from '../SettingsSection.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
const { t } = useI18n()

gql`
fragment SpecPatterns on Project {
  config
}
`

defineProps<{
  gql?: SpecPatternsFragment
}>()

const defaultValues = true

const specPatterns = [
  'cypress/component/*.cy.*.{js,ts,jsx,tsx}',
  '**/__tests__/**/*.cy.[jt]s?(x)',
  'src/**/?(*.)+(cy.|cy.).[jt]s?(x)',
]

const matches = 22
</script>
