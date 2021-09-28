<template>
  <main class="min-w-650px max-w-800px">
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
      :icon="IconBook"
    >
      <ProjectSettings />
    </SettingsCard>
  </main>
</template>

<script lang="ts" setup>
import { useI18n } from '../composables'
import SettingsCard from './SettingsCard.vue'
import ProjectSettings from './project/ProjectSettings.vue'
import DeviceSettings from './device/DeviceSettings.vue'
import IconLaptop from 'virtual:vite-icons/mdi/laptop'
import IconBook from 'virtual:vite-icons/mdi/book'

const { t } = useI18n()
</script>
