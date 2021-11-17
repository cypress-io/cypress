<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.testingPreferences.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.testingPreferences.description') }}
    </template>
    <div
      class="rounded border border-gray-100 px-16px divide-y divide-gray-200"
    >
      <div
        v-for="pref in prefs"
        :key="pref.id"
        class="py-16px"
      >
        <h4 class="text-gray-800 text-size-16px leading-24px flex items-center">
          {{ pref.title }}
          <Switch
            class="mx-8px"
            :value="props.gql.localSettings.preferences[pref.id] ?? false"
            :name="pref.title"
            @update="(value) => pref.mutation.executeMutation({ value })"
          />
        </h4>
        <p class="text-size-14px leading-24px text-gray-600">
          {{ pref.description }}
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
  SetAutoScrollingEnabledDocument,
  SetUseDarkSidebarDocument,
  SetWatchForSpecChangeDocument,
} from '@packages/data-context/src/gen/all-operations.gen'
import type { TestingPreferencesFragment } from '../../generated/graphql'

const { t } = useI18n()

gql`
fragment TestingPreferences on Query {
  localSettings {
    preferences {
      autoScrollingEnabled
      useDarkSidebar
      watchForSpecChange
    }
  }
}
`

gql`
mutation SetAutoScrollingEnabled($value: Boolean!) {
  setAutoScrollingEnabled(value: $value)
}`

gql`
mutation SetUseDarkSidebar($value: Boolean!) {
  setUseDarkSidebar(value: $value)
}`

gql`
mutation SetWatchForSpecChange($value: Boolean!) {
  setWatchForSpecChange(value: $value)
}`

const prefs = [
  {
    id: 'autoScrollingEnabled',
    title: t('settingsPage.testingPreferences.autoScrollingEnabled.title'),
    mutation: useMutation(SetAutoScrollingEnabledDocument),
    description: t('settingsPage.testingPreferences.autoScrollingEnabled.description'),
  },
  {
    id: 'useDarkSidebar',
    title: t('settingsPage.testingPreferences.useDarkSidebar.title'),
    mutation: useMutation(SetUseDarkSidebarDocument),
    description: t('settingsPage.testingPreferences.useDarkSidebar.description'),
  },
  {
    id: 'watchForSpecChange',
    title: t('settingsPage.testingPreferences.watchForSpecChange.title'),
    mutation: useMutation(SetWatchForSpecChangeDocument),
    description: t('settingsPage.testingPreferences.watchForSpecChange.description'),
  },
] as const

const props = defineProps<{
  gql: TestingPreferencesFragment
}>()
</script>
