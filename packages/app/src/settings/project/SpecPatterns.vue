<template>
  <SettingsSection
    anchor-id="specPattern"
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
          href="https://on.cypress.io"
        >
          {{ t('links.learnMore') }}
        </ExternalLink>
      </i18n-t>
    </template>
    <div class="border rounded border-gray-200 overflow-hidden">
      <div class="border-b flex border-gray-200 h-56px p-16px justify-between">
        <StatusIndicator
          :type="defaultValues ? 'success' : 'disabled'"
        >
          <span class="font-medium text-gray-700">{{ t('settingsPage.specPattern.defaultIndicator') }}</span>
        </StatusIndicator>
        <span class="rounded bg-jade-100 py-4px px-8px text-jade-600 text-size-14px leading-16px">
          <i18n-t
            scope="global"
            keypath="settingsPage.specPattern.matches"
          >
            {{ matches }}
          </i18n-t>
        </span>
      </div>
      <div class="divide-y-1 divide-gray-200 bg-gray-50 px-16px">
        <code
          v-for="pattern in specPatterns"
          :key="pattern"
          class="flex py-8px text-gray-600 text-size-14px leading-24px block"
        >
          {{ pattern }}
        </code>
      </div>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import StatusIndicator from '@cy/components/StatusIndicator.vue'
import SettingsSection from '../SettingsSection.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
const { t } = useI18n()

const defaultValues = true

const specPatterns = [
  'cypress/component/*.cy.*.{js,ts,jsx,tsx}',
  '**/__tests__/**/*.cy.[jt]s?(x)',
  'src/**/?(*.)+(cy.|cy.).[jt]s?(x)',
]

const matches = 22
</script>
