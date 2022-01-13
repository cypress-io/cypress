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
    <div class="overflow-hidden border border-gray-200 rounded">
      <div class="flex justify-between border-b border-gray-200 h-56px p-16px">
        <StatusIndicator
          :type="defaultValues ? 'success' : 'disabled'"
        >
          <span class="font-medium text-gray-700">{{ t('settingsPage.specPattern.defaultIndicator') }}</span>
        </StatusIndicator>
        <FileMatchIndicator
          data-cy="file-match-indicator"
        >
          <i18n-t
            scope="global"
            keypath="settingsPage.specPattern.matches"
          >
            {{ matches }}
          </i18n-t>
        </FileMatchIndicator>
      </div>
      <div class="divide-gray-200 divide-y-1 bg-gray-50 px-16px">
        <code
          v-for="pattern in specPatterns"
          :key="pattern"
          class="flex block text-gray-600 py-8px text-size-14px leading-24px"
          data-cy="spec-pattern"
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
import { gql } from '@urql/core'
import type { SpecPatterns_SettingsFragment } from '../../generated/graphql'
import { computed } from 'vue'
import FileMatchIndicator from '../../components/FileMatchIndicator.vue'

const { t } = useI18n()

gql`
fragment SpecPatterns_Settings on CurrentProject {
  id
  specs: specs(first: 100) {
    edges {
      node {
        id
      }
    }
  }
  config
  currentTestingType
}
`

const props = defineProps<{
  gql: SpecPatterns_SettingsFragment | null
}>()

const defaultValues = true

const matches = computed(() => props.gql?.specs?.edges.length)

const specPatterns = computed<string[]>(() => {
  let patterns = props.gql?.config.find((x) => x.field === props.gql?.currentTestingType)?.value?.specPattern

  if (!patterns) {
    return []
  }

  return typeof patterns === 'string' ? [patterns] : patterns
})
</script>
