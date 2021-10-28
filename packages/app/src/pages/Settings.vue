<template>
  <div class="p-24px">
    <SettingsCard
      :title="t('settingsPage.device.title')"
      :description="t('settingsPage.device.description')"
      :icon="IconLaptop"
    >
      <DeviceSettings />
    </SettingsCard>
    <SettingsCard
      :title="t('settingsPage.project.title')"
      :description="t('settingsPage.project.description')"
      :icon="IconFolder"
    >
      <ProjectSettings />
    </SettingsCard>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import SettingsCard from '../settings/SettingsCard.vue'
import ProjectSettings from '../settings/project/ProjectSettings.vue'
import DeviceSettings from '../settings/device/DeviceSettings.vue'
import IconLaptop from '~icons/cy/laptop_x24.svg'
import IconFolder from '~icons/cy/folder-outline_x24.svg'

const { t } = useI18n()
</script>

<route>
{
  name: "Settings Page",
  meta: {
    title: "Settings"
  }
}
</route>
