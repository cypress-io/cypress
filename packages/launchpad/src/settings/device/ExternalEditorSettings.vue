<template>
  <SettingsSection>
    <template #title>External Editor</template>
    <select value="b">
      <option value="a">Choose A</option>
      <option value="b">Choose B</option>
    </select>
  </SettingsSection>
</template>

<script lang="ts" setup>
import SettingsSection from '../SettingsSection.vue'
import Select from '../../components/Select.vue';
</script>
