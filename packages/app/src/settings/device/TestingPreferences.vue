<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.testingPreferences.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.testingPreferences.description') }}
    </template>
    <div
      class="divide-y border rounded divide-gray-200 border-gray-100 px-[16px]"
    >
      <div class="py-[16px]">
        <h4 class="flex text-gray-800 text-[16px] leading-[24px] items-center">
          <label :id="autoScrollingPreference.id">{{ autoScrollingPreference.title }}</label>
          <Switch
            id="autoScrollingToggle"
            class="mx-[8px]"
            :value="props.gql.localSettings.preferences[autoScrollingPreference.id] ?? false"
            :label-id="autoScrollingPreference.id"
            @update="(value) => updatePref(value)"
          />
        </h4>
        <p class="text-[14px] text-gray-600 leading-[24px]">
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
import { SetTestingPreferencesDocument } from '../../generated/graphql'
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
  setPreferences (value: $value, type: global) {
    ...TestingPreferences
  }
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
