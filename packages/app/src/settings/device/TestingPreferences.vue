<template>
  <SettingsSection anchor-id="testingPreferences">
    <template #title>
      {{ t('settingsPage.testingPreferences.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.testingPreferences.description') }}
    </template>
    <div
      class="rounded border border-gray-100 px-16px divide-y divide-gray-200"
    >
      <div class="py-16px">
        <h4 class="text-gray-800 text-size-16px leading-24px flex items-center">
          {{ autoScrollingPreference.title }}
          <Switch
            class="mx-8px"
            :value="props.gql.localSettings.preferences[autoScrollingPreference.id] ?? false"
            :name="autoScrollingPreference.title"
            @update="(value) => updatePref(value)"
          />
        </h4>
        <p class="text-size-14px leading-24px text-gray-600">
          {{ autoScrollingPreference.description }}
        </p>
      </div>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '@cy/i18n'
import Switch from '@packages/frontend-shared/src/components/Switch.vue'
import { gql, useMutation } from '@urql/vue'
import {
  SetTestingPreferencesDocument,
} from '@packages/data-context/src/gen/all-operations.gen'
import type { TestingPreferencesFragment } from '../../generated/graphql'

const { t } = useI18n()

gql`
fragment TestingPreferences on Query {
  localSettings {
    preferences {
      autoScrollingEnabled
    }
  }
}
`

gql`
mutation SetTestingPreferences($value: String!) {
  setPreferences (value: $value)
}`

const setPreferences = useMutation(SetTestingPreferencesDocument)

const autoScrollingPreference = {
  id: 'autoScrollingEnabled',
  title: t('settingsPage.testingPreferences.autoScrollingEnabled.title'),
  description: t('settingsPage.testingPreferences.autoScrollingEnabled.description'),
} as const

function updatePref (value: boolean) {
  setPreferences.executeMutation({
    value: JSON.stringify({ [autoScrollingPreference.id]: value }),
  })
}

const props = defineProps<{
  gql: TestingPreferencesFragment
}>()
</script>
