<template>
  <div
    class="space-y-[32px] h-[calc(100vh-[64px])] p-[32px] overflow-auto"
    data-cy="settings"
  >
    <div class="space-y-[24px]">
      <SettingsCard
        :title="t('settingsPage.project.title')"
        name="project"
        :description="t('settingsPage.project.description')"
        :icon="IconFolder"
        max-height="10000px"
      >
        <ProjectSettings
          v-if="props.gql.currentProject"
          :gql="props.gql.currentProject"
        />
      </SettingsCard>
      <SettingsCard
        :title="t('settingsPage.device.title')"
        :description="t('settingsPage.device.description')"
        name="device"
        :icon="IconLaptop"
        max-height="800px"
      >
        <ExternalEditorSettings :gql="props.gql" />
        <ProxySettings :gql="props.gql" />
        <NotificationSettings
          v-if="showNotificationSettings"
          :gql="props.gql"
        />
        <TestingPreferences :gql="props.gql" />
      </SettingsCard>
      <SettingsCard
        :title="t('settingsPage.cloud.title')"
        :description="t('settingsPage.cloud.description')"
        :icon="IconOdometer"
        name="cloud"
        max-height="10000px"
      >
        <CloudSettings :gql="props.gql" />
      </SettingsCard>
    </div>
    <hr class="border-gray-100">
    <p class="mx-auto font-light text-center text-gray-500 max-w-[500px] text-[16px] leading-[24px]">
      {{ footerText }}
    </p>
    <Button
      class="mx-auto group"
      variant="outline"
      :prefix-icon="SettingsIcon"
      prefix-icon-class="icon-dark-gray-500 icon-light-gray-50 group-hocus:icon-dark-indigo-400 group-hocus:icon-light-indigo-50"
      :href="t('settingsPage.footer.buttonLink')"
    >
      {{ t('settingsPage.footer.button') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/vue'
import Button from '@cy/components/Button.vue'
import ExternalEditorSettings from './device/ExternalEditorSettings.vue'
import ProxySettings from './device/ProxySettings.vue'
import SettingsCard from './SettingsCard.vue'
import ProjectSettings from './project/ProjectSettings.vue'
import CloudSettings from '../settings/project/CloudSettings.vue'
import TestingPreferences from './device/TestingPreferences.vue'
import NotificationSettings from './device/NotificationSettings.vue'
import type { SettingsContainerFragment } from '../generated/graphql'
import IconLaptop from '~icons/cy/laptop_x24.svg'
import IconOdometer from '~icons/cy/object-odometer_x24.svg'
import IconFolder from '~icons/cy/folder-outline_x24.svg'
import SettingsIcon from '~icons/cy/settings_x16.svg'
import { isWindows } from '@packages/frontend-shared/src/utils/isWindows'

const { t } = useI18n()

const footerText = computed(() => {
  return t('settingsPage.footer.text',
    { testingType: props.gql.currentProject?.currentTestingType === 'component'
      ? 'component'
      : 'E2E' })
})

gql`
fragment SettingsContainer on Query {
  ...TestingPreferences
  currentProject {
    id
    ...ProjectSettings
  }
  ...CloudSettings
  ...ExternalEditorSettings
  ...ProxySettings
  ...NotificationSettings
}`

const props = defineProps<{
  gql: SettingsContainerFragment
}>()

// Run notifications will initially be released without support for Windows
// https://github.com/cypress-io/cypress/issues/26786
const showNotificationSettings = !isWindows

</script>
