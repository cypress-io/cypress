<template>
  <main>
    <SettingsCard v-bind="settingsStrings.device" :icon="IconLaptop">
      <DeviceSettings/>
    </SettingsCard>
    <SettingsCard v-bind="settingsStrings.project" :icon="IconBook">
      <ProjectSettings/>
    </SettingsCard>
  </main>
</template>

<script lang="ts" setup>
  import SettingsCard from './SettingsCard.vue'
  import { settingsStrings } from '../strings'
  import ProjectSettings from './project/ProjectSettings.vue';
  import DeviceSettings from './device/DeviceSettings.vue';
  import IconLaptop from 'virtual:vite-icons/mdi/laptop'
  import IconBook from 'virtual:vite-icons/mdi/book'
</script>

