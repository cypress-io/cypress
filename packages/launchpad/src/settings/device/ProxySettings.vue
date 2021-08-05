<template>
  <SettingsSection>
    <template #title>{{ t('settingsPage.proxy.title') }}</template>
    <template #description>{{ t('settingsPage.proxy.description') }}</template>
    <select value="b">
      <option value="a">Choose A</option>
      <option value="b">Choose B</option>
    </select>
  </SettingsSection>
</template>

<script lang="ts" setup>
import SettingsSection from '../SettingsSection.vue'
import Select from '../../components/select/Select.vue';
import { useI18n } from '../../composables';

const { t } = useI18n()
</script>
