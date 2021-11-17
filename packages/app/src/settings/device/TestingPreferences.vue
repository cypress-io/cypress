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
        :key="pref.title"
        class="py-16px"
      >
        <h4 class="text-gray-800 text-size-16px leading-24px flex items-center">
          {{ pref.title }}
          <Switch
            class="mx-8px"
            :value="props.gql.localSettings.preferences.autoScrollingEnabled"
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
import { ref, watchEffect } from 'vue'
import SettingsSection from '../SettingsSection.vue'
import { useI18n } from '@cy/i18n'
import Switch from '@packages/frontend-shared/src/components/Switch.vue'
import { gql, useMutation } from '@urql/vue'
import { 
  SetAutoScrollingEnabledDocument,
  SetUseDarkSidebarDocument,
  SetWatchForSpecChangeDocument
} from '@packages/data-context/src/gen/all-operations.gen'
import type { TestingPreferencesFragment } from '../../generated/graphql'
import type { DevicePreferences } from '@packages/types/src/devicePreferences'

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
    title: t('settingsPage.testingPreferences.autoScrollingEnabled'),
    mutation: useMutation(SetAutoScrollingEnabledDocument),
    description: 'alalalala'
  }
] as const

const props = defineProps<{
  gql: TestingPreferencesFragment
}>()

// const autoScrollingEnabled = ref(props.gql.autoScrollingEnabled)

// watchEffect(() => {
//   autoScrollingEnabled.value = props.gql.autoScrollingEnabled
//   autoScrollingEnabled.value = props.gql.autoScrollingEnabled
//   autoScrollingEnabled.value = props.gql.autoScrollingEnabled
// })

// const setAutoScrollingEnabled = 
// const setUseDarkSidebar = useMutation(SetUseDarkSidebarDocument)
// const setWatchForSpecChange = useMutation(SetWatchForSpecChangeDocument)
</script>
