<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.testingPreferences.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.testingPreferences.description') }}
    </template>
    <div
      class="rounded border border-gray-200 px-16px divide-y divide-gray-200"
    >
      <div
        v-for="pref in prefs"
        :key="pref.title"
        class="py-16px"
      >
        <h4 class="text-gray-800 text-size-16px leading-24px flex items-center">
          {{ pref.title }}<Switch
            class="mx-8px"
            :value="pref.enabled"
            :name="pref.title"
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
import Switch from '../../../../frontend-shared/src/components/Switch.vue'

const { t } = useI18n()

const prefs = [
  {
    title: 'Auto-scrolling',
    enabled: true,
    description: 'Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
]

</script>
